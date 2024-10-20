import { ListsT } from '../../../database/models/list'
import { GenericGroup } from '../../../database/models/user'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { SyncCmds } from '../../protocol/commands'
import { ErrorCode } from '../../protocol/error_codes'
import {
	buildLegacyGroupIDsMap,
	createFakeContactUserBySN,
	createFakeContactUserByUID,
	getClVersions,
	getLegacyGroupIDs,
	getListBitByListType,
	getModernSYNTimestamp,
	getSNfromMail,
	makeEmailFromSN,
	runSequentially,
	sendSyncCmd,
} from '../../util'
import { PulseInteractableArgs } from '../../framework/interactable'
import {
	ContactType,
	ListBitFlags,
	ListTypes,
	ListTypesT,
	PrivacyModes,
	Properties,
} from '../../protocol/sync'
import {
	getListEntryByIDs,
	insertListEntry,
	updateListEntryBitsByIDs,
} from '../../../database/queries/lists'
import { updateUserClVersionByUID, updateUserPrivacyOptionsByUID } from '../../../database/queries/user'

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
 *   MSNP8:
 *     -> SYN [trId] [clientSyncId]
 *     <- SYN [trId] [serverSyncId] [totalContacts?] [totalGroups?]
 *
 *   MSNP10:
 *     -> SYN [trId] [clTimestamp1] [clTimestamp2]
 *     <- SYN [trId] [srvTimestamp1] [srvTimestamp2] [totalContacts] [totalGroups]
 *
 * Privacy Settings:
 *   MSNP2:
 *     <- GTC [trId] [serverSyncId] [setting=A|N]
 *     <- BLP [trId] [serverSyncId] [setting=AL|BL]
 *
 *   MSNP10:
 *     <- GTC [setting=A|N]
 *     <- BLP [setting=AL|BL]
 *
 * User Properties (MSNP5+):
 *   MSNP5:
 *     <- PRP [trId] [serverSyncId] [property=PHH] [homePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHW] [workPhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=WWE] [directPaging=0|2]
 *
 *   MSNP10:
 *     <- PRP [property=PHH] [homePhoneNumber?]
 *     <- PRP [property=PHW] [workPhoneNumber?]
 *     <- PRP [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [property=WWE] [directPaging=0|2]
 *     <- PRP [property=MFN] [friendlyName]
 *
 *   MSNP11:
 *     <- PRP [property=HSB] [hasBlog=0|1]
 *
 * Groups (MSNP7+):
 *   MSNP7:
 *     <- LSG [trId] [serverSyncId] [groupIdx] [totalGroups] [GroupName] [unk=0]
 *
 *   MSNP10:
 *     <- LSG [groupName] [groupGUID]
 *
 * Contact Lists:
 *   MSNP2:
 *     <- LST [trId] [listType=FL|RL|AL|BL] [listVerId] [userIdx] [totalUsers] [passport?] [friendlyName?] [groupIds[,]?]
 *
 *   MSNP10:
 *    <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [groupGUIDs[,]]
 *
 *   MSNP12:
 *    <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [contactType] [groupGUIDs[,]]
 *
 * Contact Properties (MSNP5+):
 *   MSNP5:
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHH] [homePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHW] [workPhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [trId] [serverSyncId] [passport] [property=WWE] [directPaging=0|2]
 *
 *   MSNP10:
 *     <- BRP [property=PHH] [homePhoneNumber?]
 *     <- BRP [property=PHW] [workPhoneNumber?]
 *     <- BRP [property=PHM] [mobilePhoneNumber?]
 *     <- BRP [property=MOB] [contactOnMobile=N|Y]
 *     <- BRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- BRP [property=WWE] [directPaging=0|2]
 *     <- BRP [property=MFN] [friendlyName]
 *
 *   MSNP11:
 *     <- BRP [property=HSB] [hasBlog=0|1]
 */
export const handleSYN = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command SYN')
		return user.client.ns.quit()
	}

	if (cmd.Args.length <= 0 || cmd.Args.length >= 3) {
		user.error('Client provided an invalid number of arguments to command SYN')
		return user.client.ns.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	if (user.context.messenger.dialect >= 13) {
		user.warn(
			`Client tried to call GCF using an unsupported dialect MSNP${user.context.messenger.dialect}`
		)
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
 * MSNP8:
 *   -> SYN [trId] [clientSyncId]
 *   <- SYN [trId] [serverSyncId] [totalContacts?] [totalGroups?]
 *
 * MSNP10:
 *   -> SYN [trId] [clTimestamp1] [clTimestamp2]
 *   <- SYN [trId] [srvTimestamp1] [srvTimestamp2] [totalContacts] [totalGroups]
 *
 * - false = Should ReSync, true = up to date -
 */
const handleSYN_BeginSynchronization = async (user: PulseUser, cmd: PulseCommand) => {
	// MSNP11 & MSNP12
	if (user.context.messenger.dialect >= 10) {
		// i fucking hate MSNP10
		const tz = getModernSYNTimestamp()
		user.client.ns.reply(cmd, [
			tz,
			tz,
			user.data.list.length,
			user.data.user.ContactGroups?.length ?? 0,
		])
		return false
	}

	const cl = getClVersions(user, cmd)
	const isSyncUpdated = cl.client === cl.server

	// MSNP7 - MSNP9
	if (user.context.messenger.dialect >= 7) {
		let args = [cl.server]
		if (!isSyncUpdated) {
			args = [...args, user.data.list.length, user.data.user.ContactGroups?.length ?? 0]
		}

		user.client.ns.reply(cmd, args)
		return isSyncUpdated
	}

	// MSNP2 - MSNP6
	{
		user.client.ns.reply(cmd, [cl.server])
		return isSyncUpdated
	}
}

/*
 * MSNP2:
 *   <- GTC [trId] [serverSyncId] [setting=A|N]
 *   <- BLP [trId] [serverSyncId] [setting=AL|BL]
 *
 * MSNP10:
 *   <- GTC [setting=A|N]
 *   <- BLP [setting=AL|BL]
 */
const handleSYN_PrivacySettings = async (user: PulseUser, cmd: PulseCommand) => {
	const priv = user.data.user.PrivacyOptions

	sendSyncCmd(user, SyncCmds.FriendRequestPrivacy, cmd.TrId, [priv.friendRequest])
	sendSyncCmd(user, SyncCmds.InstantMessagesPrivacy, cmd.TrId, [priv.instantMessages])
}

/*
 * User Properties (MSNP5+)
 *   MSNP5:
 *     <- PRP [trId] [serverSyncId] [property=PHH] [homePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHW] [workPhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [trId] [serverSyncId] [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [trId] [serverSyncId] [property=WWE] [directPaging=0|2]
 *
 *   MSNP10:
 *     <- PRP [property=PHH] [homePhoneNumber?]
 *     <- PRP [property=PHW] [workPhoneNumber?]
 *     <- PRP [property=PHM] [mobilePhoneNumber?]
 *     <- PRP [property=MOB] [contactOnMobile=N|Y]
 *     <- PRP [property=MBE] [isMobileEnabled=N|Y]
 *     <- PRP [property=WWE] [directPaging=0|2]
 *     <- PRP [property=MFN] [friendlyName]
 *
 *   MSNP11:
 *     <- PRP [property=HSB] [hasBlog=0|1]
 *
 * Contact Properties (MSNP5+):
 *   MSNP5:
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
 *   MSNP10:
 *     <- BRP [property=MFN] [friendlyName]
 *
 *   MSNP11:
 *     <- BRP [property=HSB] [hasBlog=0|1]
 */
const handleSYN_Properties = async (
	user: PulseUser,
	cmd: PulseCommand,
	contactProperties: boolean = false
) => {
	if (user.context.messenger.dialect < 5) {
		return user.info(
			`Ignoring ${contactProperties ? 'contact' : 'user'} properties sync... (client is too old)`
		)
	}

	// TODO: impl MOB, MBE and WWE correctly
	const details = user.data.details
	const prop = contactProperties ? SyncCmds.ContactPropertiesLegacy : SyncCmds.UserPropertiesLegacy

	sendSyncCmd(user, prop, cmd.TrId, [Properties.PhoneHome, details.PhoneHome ?? ''])
	sendSyncCmd(user, prop, cmd.TrId, [Properties.PhoneWork, details.PhoneWork ?? ''])
	sendSyncCmd(user, prop, cmd.TrId, [Properties.PhoneMobile, details.PhoneMobile ?? ''])

	// are other people authorised to contact me on my MSN Mobile device?; can be Y ("yes") or N ("no")
	sendSyncCmd(user, prop, cmd.TrId, [Properties.ContactOnMobile, 1 === 1 ? 'N' : 'Y'])

	// do I have a mobile device enabled on MSN Mobile; can be Y ("yes") or N ("no")
	sendSyncCmd(user, prop, cmd.TrId, [Properties.MobileEnabled, 1 === 1 ? 'N' : 'Y'])

	// If set to 2, direct-paging is enabled. 0 otherwise.
	sendSyncCmd(user, prop, cmd.TrId, [Properties.DirectPaging, 1 === 1 ? '0' : '2'])

	if (user.context.messenger.dialect >= 10) {
		user.client.ns.untracked(prop, [
			Properties.FriendlyName,
			encodeURIComponent(user.data.user.DisplayName),
		])
	}

	// TODO: impl HSB correctly
	if (user.context.messenger.dialect >= 11) {
		user.client.ns.untracked(prop, [Properties.HasBlog, !(1 === 1)])
	}
}

/*
 * MSNP7:
 *   <- LSG [trId] [serverSyncId] [groupIdx] [totalGroups] [GroupName] [unk=0]
 *
 * MSNP10:
 *   <- LSG [groupName] [groupGUID]
 */
const handleSYN_ContactGroups = async (user: PulseUser, cmd: PulseCommand) => {
	if (user.context.messenger.dialect < 7) {
		return user.info('Ignoring groups sync... (client is too old)')
	}

	let groupIdx = 0
	if (user.context.messenger.dialect <= 9) {
		user.client.ns.send(SyncCmds.ListGroupsLegacy, cmd.TrId, [
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

	for (const dbGroup of user.data.user.ContactGroups) {
		if (user.context.messenger.dialect >= 10) {
			user.client.ns.untracked(SyncCmds.ListGroupsLegacy, [dbGroup.name, dbGroup.guid])
			continue
		}

		user.client.ns.send(SyncCmds.ListGroupsLegacy, cmd.TrId, [
			user.data.user.ClVersion,
			groupIdx++,
			user.data.user.ContactGroups.length,
			dbGroup.name,
			0,
		])
	}
}

/*
 * MSNP2:
 *   <- LST [trId] [listType=FL|RL|AL|BL] [listVer] [userIdx] [totalUsers] [passport?] [friendlyName?] [groupIds[,]?]
 *
 * MSNP10:
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
			`F=${encodeURIComponent(contact.data.user.DisplayName)}`,
			`C=${contact.data.account.GUID}`,
			listBits,
		]

		if (user.context.messenger.dialect === 12) {
			args = [...args, ContactType.MSN]
		}

		if (listBits & ListBitFlags.Forward) {
			args = [...args, groups.join(',')]
		}

		return user.client.ns.untracked(SyncCmds.ListContactsLegacy, args)
	}

	const syncContactByLegacySyncID = (
		list: ListsT,
		listType: ListTypesT,
		user: PulseUser,
		contact: PulseUser,
		userIdx: number,
		listLen: number,
		groups: Map<string, number>
	) => {
		let args: PulseInteractableArgs = [
			listType,
			user.data.user.ClVersion,
			userIdx,
			listLen,
			makeEmailFromSN(contact.data.account.ScreenName, user.context.messenger.dialect === 2),
			encodeURIComponent(contact.data.user.DisplayName),
		]

		if (listType === ListTypes.Forward && user.context.messenger.dialect >= 7) {
			args = [...args, getLegacyGroupIDs(list, groups).join(',')]
		}

		return user.client.ns.send(SyncCmds.ListContactsLegacy, cmd.TrId, args)
	}

	const syncList = async (lists: ListsT[]) => {
		// Legacy "syncId" Sync Mode

		if (!user.data.list.length) {
			user.info('Ignoring contacts sync... (none found)')
		}

		const legacySync = async (syncList: ListsT[], listType: ListTypesT) => {
			let userIdx = 0

			if (!syncList.length) {
				user.info(`Ignoring ${listType} list sync... (empty)`)
				user.client.ns.send(SyncCmds.ListContactsLegacy, cmd.TrId, [
					listType,
					user.data.user.ClVersion,
					0,
					0,
				])
				return true
			}

			for (const list of syncList) {
				const contact = await createFakeContactUserByUID(user, list.ContactID)
				if (!contact) return false

				const listLen = syncList.length
				const groups = buildLegacyGroupIDsMap(list.Groups ?? [])

				// MSNP2+ LST
				syncContactByLegacySyncID(list, listType, user, contact, ++userIdx, listLen, groups)

				if (listType !== ListTypes.Forward) {
					continue
				}

				// MSNP8+ BRP
				await handleSYN_Properties(contact, cmd, true)
			}

			return true
		}

		if (user.context.messenger.dialect < 10) {
			const tasks = [
				() =>
					legacySync(
						lists.filter((lst) => lst.ListBits & ListBitFlags.Forward),
						ListTypes.Forward
					),
				() =>
					legacySync(
						lists.filter((lst) => lst.ListBits & ListBitFlags.Allow),
						ListTypes.Allow
					),
				() =>
					legacySync(
						lists.filter((lst) => lst.ListBits & ListBitFlags.Block),
						ListTypes.Block
					),
				() =>
					legacySync(
						lists.filter((lst) => lst.ListBits & ListBitFlags.Reverse),
						ListTypes.Reverse
					),
			]

			const res = await runSequentially(tasks)
			return !res.some((aRes) => !aRes)
		}

		// Modern "untracked" Sync Mode
		for (const list of lists) {
			const contact = await createFakeContactUserByUID(user, list.ContactID)
			if (!contact) return false

			// MSNP10+ LST
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

/*
 * MSNP2 - MSNP9:
 *   -> BLP [trId] [setting=AL|BL]
 *   <- BLP [trId] [serverSyncId + 1]
 *
 * MSNP10+:
 *   - Fuck around and find out -
 */
export const handleBLP = async (user: PulseUser, cmd: PulseCommand) => {
	// if (user.context.messenger.dialect >= 10) {
	// 	user.warn(
	// 		`Client tried to call ADD using an unsupported dialect MSNP${user.context.messenger.dialect}`
	// 	)
	// 	return user.client.ns.error(cmd, ErrorCode.DisabledCommand)
	// }

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command BLP')
		return user.client.ns.quit()
	}

	if (cmd.Args.length !== 1) {
		user.error(`Client provided an invalid amount of arguments to command BLP`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const setting = cmd.Args[0]
	if (setting !== PrivacyModes.BLP_AllowEveryone && setting !== PrivacyModes.BLP_OnlyAllowList) {
		user.error(`Client provided a setting to command BLP! Provided was: ${setting}`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const dbSetting = user.data.user.PrivacyOptions.instantMessages
	if (setting === dbSetting) {
		user.warn(
			`Client provided a setting that was already set as the current mode to BLP! Provided was: ${setting}`
		)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	// update details
	{
		user.data.user.PrivacyOptions.instantMessages = setting
		await updateUserPrivacyOptionsByUID(user.data.account.UID, user.data.user.PrivacyOptions)

		user.data.user.ClVersion += 1
		await updateUserClVersionByUID(user.data.account.UID, user.data.user.ClVersion)
	}

	return user.client.ns.reply(cmd, [user.data.user.ClVersion])
}

/*
 * MSNP2 - MSNP9:
 *   -> GTC [trId] [setting=A|N]
 *   <- GTC [trId] [serverSyncId + 1]
 *
 * MSNP10 - MSNP12:
 *   - Fuck around and find out -
 *
 * MSNP13+:
 *   - Command is Disabled -
 */
export const handleGTC = async (user: PulseUser, cmd: PulseCommand) => {
	if (user.context.messenger.dialect >= 13) {
		user.warn(
			`Client tried to call GTC using an unsupported dialect MSNP${user.context.messenger.dialect}`
		)
		return user.client.ns.error(cmd, ErrorCode.DisabledCommand)
	}

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command GTC')
		return user.client.ns.quit()
	}

	if (cmd.Args.length !== 1) {
		user.error(`Client provided an invalid amount of arguments to command GTC`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const setting = cmd.Args[0]
	if (
		setting !== PrivacyModes.GTC_NotifyReverseList &&
		setting !== PrivacyModes.GTC_IgnoreReverseList
	) {
		user.error(`Client provided a setting to command GTC! Provided was: ${setting}`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const dbSetting = user.data.user.PrivacyOptions.friendRequest
	if (setting === dbSetting) {
		user.warn(
			`Client provided a setting that was already set as the current mode to GTC! Provided was: ${setting}`
		)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	// update details
	{
		user.data.user.PrivacyOptions.friendRequest = setting
		await updateUserPrivacyOptionsByUID(user.data.account.UID, user.data.user.PrivacyOptions)

		user.data.user.ClVersion += 1
		await updateUserClVersionByUID(user.data.account.UID, user.data.user.ClVersion)
	}

	return user.client.ns.reply(cmd, [user.data.user.ClVersion])
}
