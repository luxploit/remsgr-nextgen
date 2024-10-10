import { ListsT } from '../../../database/models/list'
import { GenericGroup } from '../../../database/models/user'
import { populatePulseDataByUID } from '../../../database/queries/populate'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { SyncCmds } from '../../protocol/commands'
import { ErrorCode } from '../../protocol/error_codes'
import {
	buildLegacyGroupIDsMap,
	createFakeContactUser,
	getClVersions,
	getLegacyGroupIDs,
	getListVer,
	getModernSYNTimestamp,
	makeEmailFromSN,
	sendSyncCmd,
} from '../../util'
import { PulseInteractableArgs } from '../../framework/interactable'
import { ContactType, ListBitFlags, ListTypes, UserProperties } from '../../protocol/sync'
import { ListTypesT } from '../../protocol/constants'

/*
 * - SyncId(0 or Mismatch) = Resync Everything -
 * - SyncTime(0 or mismatch) = Resync Everything -
 *
 * - Dialect >= 13: Command is Disabled -
 *
 * Sync Start:
 *   MSNP2:
 *     -> SYN [trId] [clientSyncId]
 *     <- SYN [trId] [serverSyncId]
 *
 *   MSNP11:
 *     -> SYN [trId] [clTimestamp1] [clTimestamp2]
 *     <- SYN [trId] [srvTimestamp1] [srvTimestamp2] [totalContacts] [totalGroups]
 *
 * Privacy Settings:
 *   MSNP2:
 *     <- GTC [trId] [serverSyncId] [setting=A|N]
 *     <- BLP [trId] [serverSyncId] [setting=AL|BL]
 *
 *   MSNP11:
 *     <- GTC [setting=A|N]
 *     <- BLP [setting=AL|BL]
 *
 * User Properties (MSNP8+):
 *   MSNP8:
 *     <- PRP [trId] [serverSyncId] [property=PHH] [homePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHW] [workPhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=WWE] [directPaging=0|2]
 *
 *   MSNP11:
 *     <- PRP [property=PHH] [homePhoneNumber?]
 *     <- PRP [property=PHW] [workPhoneNumber?]
 *     <- PRP [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [property=WWE] [directPaging=0|2]
 *     <- PRP [property=MFN] [friendlyName]
 *     <- PRP [property=HSB] [hasBlog=0|1]
 *
 * Groups (MSNP7+):
 *   MSNP7:
 *     <- LSG [trId] [serverSyncId] [groupIdx] [totalGroups] [GroupName] [unk=0]
 *
 *   MSNP11:
 *     <- LSG [groupName] [groupGUID]
 *
 * Contact Lists:
 *   MSNP2:
 *     <- LST [trId] [serverSyncId] [listType=FL|RL|AL|BL] [listVerId] [userIdx] [totalUsers] [passport?] [friendlyName?] [groupIds[,]?]
 *
 *   MSNP11:
 *    <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [groupGUIDs[,]]
 *
 *   MSNP12:
 *    <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [contactType] [groupGUIDs[,]]
 *
 * Contact Properties (MSNP8+):
 *   MSNP8:
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHH] [homePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHW] [workPhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=WWE] [directPaging=0|2]
 *
 *   MSNP11:
 *     <- BRP [property=PHH] [homePhoneNumber?]
 *     <- BRP [property=PHW] [workPhoneNumber?]
 *     <- BRP [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [property=WWE] [directPaging=0|2]
 *     <- BRP [property=MFN] [friendlyName]
 *     <- BRP [property=HSB] [hasBlog=0|1]
 */
export const handleSYN = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.Args.length <= 0 || cmd.Args.length >= 3) {
		return user.client.sb.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	if (user.context.protoDialect >= 13) {
		user.error('Client tried to call SYN with unsupported protocol version:', user.context.protoName)
		return user.client.ns.fatal(cmd, ErrorCode.DisabledCommand)
	}

	user.info('Starting legacy synchornization process...')
	const isSyncUpdated = await handleSYN_BeginSynchronization(user, cmd)

	if (isSyncUpdated) {
		return user.info('Finished synchronization early (nothing to re-sync)!')
	}

	user.info('Syncing privacy settings...')
	await handleSYN_PrivacySettings(user, cmd)

	user.info('Syncing user properties...')
	await handleSYN_Properties(user, cmd)

	user.info('Syncing groups...')
	await handleSYN_ContactGroups(user, cmd)

	user.info('Syncing contacts and properties...')
	await handleSYN_ContactsLists(user, cmd)

	user.info('Finished synchronization!')
}

/*
 * MSNP2:
 *   -> SYN [trId] [clientSyncId]
 *   <- SYN [trId] [serverSyncId]
 *
 * MSNP11:
 *   -> SYN [trId] [clTimestamp1] [clTimestamp2]
 *   <- SYN [trId] [srvTimestamp1] [srvTimestamp2] [totalContacts] [totalGroups]
 *
 * - false = Should ReSync, true = up to date -
 */
const handleSYN_BeginSynchronization = async (user: PulseUser, cmd: PulseCommand) => {
	// MSNP11 & MSNP12
	if (user.context.protoDialect >= 11) {
		// i fucking hate MSNP11
		const tz = getModernSYNTimestamp()
		user.client.ns.reply(cmd, [
			tz,
			tz,
			user.data.list.length,
			user.data.user.ContactGroups?.length ?? 0,
		])
		return false
	}

	if (user.context.protoDialect >= 8) {
		const cl = getClVersions(user, cmd)
		user.client.ns.reply(cmd, [
			cl.server,
			user.data.list.length,
			user.data.user.ContactGroups?.length ?? 0,
		])
		return cl.client === cl.server
	}

	// MSNP2 - MSNP7
	{
		const cl = getClVersions(user, cmd)
		user.client.ns.reply(cmd, [cl.server])
		return cl.client === cl.server
	}
}

/*
 * MSNP2:
 *   <- GTC [trId] [serverSyncId] [setting=A|N]
 *   <- BLP [trId] [serverSyncId] [setting=AL|BL]
 *
 * MSNP11:
 *   <- GTC [setting=A|N]
 *   <- BLP [setting=AL|BL]
 */
const handleSYN_PrivacySettings = async (user: PulseUser, cmd: PulseCommand) => {
	// TODO: Respect privacy settings!

	sendSyncCmd(user, SyncCmds.FriendRequestPrivacy, cmd.TrId, ['A'])
	sendSyncCmd(user, SyncCmds.InstantMessagesPrivacy, cmd.TrId, ['AL'])
}

/*
 * User Properties (MSNP7+)
 *   MSNP7:
 *     <- PRP [trId] [serverSyncId] [property=PHH] [homePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHW] [workPhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=WWE] [directPaging=0|2]
 *
 *   MSNP8:
 *     <- PRP [property=PHH] [homePhoneNumber?]
 *     <- PRP [property=PHW] [workPhoneNumber?]
 *     <- PRP [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [property=WWE] [directPaging=0|2]
 *
 *   MSNP11:
 *     <- PRP [property=MFN] [friendlyName]
 *     <- PRP [property=HSB] [hasBlog=0|1]
 *
 * Contact Properties (MSNP7+):
 *   MSNP7:
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHH] [homePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHW] [workPhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=WWE] [directPaging=0|2]
 *
 *   MSNP8:
 *     <- BRP [property=PHH] [homePhoneNumber?]
 *     <- BRP [property=PHW] [workPhoneNumber?]
 *     <- BRP [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [property=WWE] [directPaging=0|2]
 *
 *   MSNP11:
 *     <- BRP [property=MFN] [friendlyName]
 *     <- BRP [property=HSB] [hasBlog=0|1]
 */
const handleSYN_Properties = async (
	user: PulseUser,
	cmd: PulseCommand,
	contactProperties: boolean = false
) => {
	if (user.context.protoDialect < 7) {
		return user.info(
			`Ignoring ${contactProperties ? 'contact' : 'user'} properties sync... (client is too old)`
		)
	}

	// TODO: impl MOB, MBE and WWE correctly
	const details = user.data.details
	const prop = contactProperties ? SyncCmds.ContactProperties : SyncCmds.UserProperties

	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.PhoneHome, details.PhoneHome ?? ''])
	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.PhoneWork, details.PhoneWork ?? ''])
	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.PhoneMobile, details.PhoneMobile ?? ''])

	// are other people authorised to contact me on my MSN Mobile device?; can be Y ("yes") or N ("no")
	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.ContactOnMobile, 1 === 1 ? 'N' : 'Y'])

	// do I have a mobile device enabled on MSN Mobile; can be Y ("yes") or N ("no")
	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.MobileEnabled, 1 === 1 ? 'N' : 'Y'])

	// If set to 2, direct-paging is enabled. 0 otherwise.
	sendSyncCmd(user, prop, cmd.TrId, [UserProperties.DirectPaging, 1 === 1 ? '0' : '2'])

	// TODO: impl HSB correctly
	if (user.context.protoDialect >= 11) {
		user.client.ns.untracked(prop, [UserProperties.FriendlyName, user.data.user.DisplayName])

		user.client.ns.untracked(prop, [UserProperties.HasBlog, !(1 === 1)])
	}
}

/*
 * MSNP7:
 *   <- LSG [trId] [serverSyncId] [groupIdx] [totalGroups] [GroupName] [unk=0]
 *
 * MSNP11:
 *   <- LSG [groupName] [groupGUID]
 */
const handleSYN_ContactGroups = async (user: PulseUser, cmd: PulseCommand) => {
	if (user.context.protoDialect < 7) {
		return user.info('Ignoring groups sync... (client is too old)')
	}

	let groupIdx = 0
	if (user.context.protoDialect <= 10) {
		user.client.ns.send(SyncCmds.ListGroups, cmd.TrId, [
			user.data.user.ClVersion,
			groupIdx++,
			user.data.user.ContactGroups?.length ?? 1,
			encodeURIComponent('Other Contacts'),
			0,
		])
	}

	if (!user.data.user.ContactGroups) {
		return user.info('Ignoring groups sync... (none found)')
	}

	const dbGroups = user.data.user.ContactGroups as GenericGroup[]
	for (const dbGroup of dbGroups) {
		if (user.context.protoDialect >= 11) {
			user.client.ns.untracked(SyncCmds.ListGroups, [dbGroup.name, dbGroup.guid])
			continue
		}

		user.client.ns.send(SyncCmds.ListGroups, cmd.TrId, [
			user.data.user.ClVersion,
			groupIdx++,
			dbGroups.length,
			dbGroup.name,
			0,
		])
	}
}

/*
 * MSNP2:
 *   <- LST [trId] [serverSyncId] [listType=FL|RL|AL|BL] [listVerId] [userIdx] [totalUsers] [passport?] [friendlyName?] [groupIds[,]?]
 *
 * MSNP11:
 *  <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [groupGUIDs[,]]
 *
 * MSNP12:
 *  <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [contactType] [groupGUIDs[,]]
 */
const handleSYN_ContactsLists = async (user: PulseUser, cmd: PulseCommand) => {
	const syncContactUntracked = (
		listBits: number,
		user: PulseUser,
		contact: PulseUser,
		groups: string[]
	) => {
		let args: PulseInteractableArgs = [
			`N=${makeEmailFromSN(contact.data.account.ScreenName)}`,
			`F=${contact.data.user.DisplayName}`,
			`C=${contact.data.account.GUID}`,
			listBits,
		]

		if (user.context.protoDialect === 12) {
			args = [...args, ContactType.MSN]
		}

		if (listBits & ListBitFlags.Forward) {
			args = [...args, groups.join(',')]
		}

		return user.client.ns.untracked(SyncCmds.ListContacts, args)
	}

	const syncContactByLegacySyncID = (
		list: ListsT,
		listType: ListTypesT,
		user: PulseUser,
		contact: PulseUser,
		userIdx: number,
		listVer: number,
		listLen: number,
		groups: Map<string, number>
	) => {
		let args: PulseInteractableArgs = [
			user.data.user.ClVersion,
			listType,
			listVer,
			userIdx,
			listLen,
			makeEmailFromSN(contact.data.account.ScreenName),
			contact.data.user.DisplayName,
		]

		if (listType === ListTypes.Forward) {
			args = [...args, getLegacyGroupIDs(list, groups).join(',')]
		}

		return user.client.ns.send(SyncCmds.ListContacts, cmd.TrId, args)
	}

	const syncList = async (lists: ListsT[]) => {
		// Legacy "syncId" Sync Mode

		if (!user.data.list.length) {
			user.info('Ignoring contacts sync... (none found)')
		}

		const legacySync = async (syncList: ListsT[], listType: ListTypesT) => {
			let userIdx = 0

			for (const list of syncList) {
				const contact = await createFakeContactUser(user, list.ContactID)
				if (!contact) return false

				const listVer = getListVer(listType, user.data.user)
				const listLen = syncList.length
				const groups = buildLegacyGroupIDsMap(list.Groups ?? [])

				// MSNP2+ LST
				syncContactByLegacySyncID(
					list,
					listType,
					user,
					contact,
					userIdx++,
					listVer,
					listLen,
					groups
				)

				if (listType !== ListTypes.Forward) {
					continue
				}

				// MSNP8+ BRP
				await handleSYN_Properties(contact, cmd, true)
			}

			return true
		}

		if (user.context.protoDialect < 11) {
			const res = await Promise.all([
				legacySync(
					lists.filter((lst) => lst.ListBits & ListBitFlags.Forward),
					ListTypes.Forward
				),
				legacySync(
					lists.filter((lst) => lst.ListBits & ListBitFlags.Allow),
					ListTypes.Allow
				),
				legacySync(
					lists.filter((lst) => lst.ListBits & ListBitFlags.Block),
					ListTypes.Block
				),
				legacySync(
					lists.filter((lst) => lst.ListBits & ListBitFlags.Reverse),
					ListTypes.Reverse
				),
			])

			return res.some((aRes) => !aRes)
		}

		// Modern "untracked" Sync Mode
		for (const list of lists) {
			const contact = await createFakeContactUser(user, list.ContactID)
			if (!contact) return false

			// MSNP11+ LST
			syncContactUntracked(list.ListBits, user, contact, list.Groups ?? [])

			if (!(list.ListBits & ListBitFlags.Forward)) {
				continue
			}

			// MSNP8+ BRP
			await handleSYN_Properties(contact, cmd, true)
		}

		return true
	}

	// if (!user.data.list.length) {
	// 	return user.info('Ignoring contacts sync... (none found)')
	// }

	// TODO: look at PL shit?
	if (!(await syncList(user.data.list))) {
		return user.client.ns.fatal(cmd, ErrorCode.DatabaseError)
	}
}
