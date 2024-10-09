import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { SyncCmds } from '../../protocol/commands'
import { UserProperties } from '../../protocol/constants'
import { ErrorCode } from '../../protocol/error_codes'
import { getClVersions, getModernSYNTimestamp } from '../../util'

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
	const shouldSync = await handleSYN_BeginSynchronization(user, cmd)

	if (!shouldSync) {
		return user.info('Finished synchronization early (nothing to re-sync)!')
	}

	user.info('Syncing privacy settings...')
	await handleSYN_PrivacySettings(user, cmd)

	user.info('Syncing properties...')
	await handleSYN_UserProperties(user, cmd)
	// if (user.context.protoDialect >= 8) {

	// 	// TODO: impl MOB, MBE and WWE correctly
	// 	const details = user.data.details
	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.PhoneHome,
	// 		details.PhoneHome ?? '',
	// 	])

	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.PhoneWork,
	// 		details.PhoneWork ?? '',
	// 	])

	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.PhoneMobile,
	// 		details.PhoneMobile ?? '',
	// 	])

	// 	// are other people authorised to contact me on my MSN Mobile device?; can be Y ("yes") or N ("no")
	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.ContactOnMobile,
	// 		1 === 1 ? 'N' : 'Y',
	// 	])

	// 	// do I have a mobile device enabled on MSN Mobile; can be Y ("yes") or N ("no")
	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.MobileEnabled,
	// 		1 === 1 ? 'N' : 'Y',
	// 	])

	// 	// If set to 2, direct-paging is enabled. 0 otherwise.
	// 	user.client.ns.send(SyncCmds.UserProperties, cmd.TrId, [
	// 		UserProperties.DirectPaging,
	// 		1 === 1 ? '0' : '2',
	// 	])
	// }

	user.info('Syncing groups...')
	await handleSYN_ContactGroups(user, cmd)
	// if (user.context.protoDialect >= 7) {

	// 	// TODO: Impl group sync
	// }

	user.info('Syncing contacts...')
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
 */
const handleSYN_BeginSynchronization = async (user: PulseUser, cmd: PulseCommand) => {
	// MSNP11 & MSNP12
	if (user.context.protoDialect >= 11) {
		// i fucking hate MSNP11
		const tz = getModernSYNTimestamp()
		user.client.ns.reply(cmd, [tz, tz, user.data.list.length, user.data.user.Groups?.length ?? 0])
		return true
	}

	// MSNP2 - MSNP10
	{
		const cl = getClVersions(user, cmd)
		user.client.ns.reply(cmd, [cl.server])
		return cl.client === cl.server && cl.client !== 0
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
	user.client.ns.send(SyncCmds.FriendRequestPrivacy, cmd.TrId, [user.data.user.ClVersion, 'A'])
	user.client.ns.send(SyncCmds.InstantMessagesPrivacy, cmd.TrId, [user.data.user.ClVersion, 'AL'])
}

/*
 *  MSNP8:
 *   <- PRP [trId] [serverSyncId] [property=PHH] [homePhoneNumber?]
 *   <- PRP [trId] [serverSyncId] [property=PHW] [workPhoneNumber?]
 *   <- PRP [trId] [serverSyncId] [property=PHM] [mobilePhoneNumber?]
 *   <- PRP [trId] [serverSyncId] [property=MOB] [contactOnMobile=N|Y]
 *   <- PRP [trId] [serverSyncId] [property=MBE] [isMobileEnabled=N|Y]
 *   <- PRP [trId] [serverSyncId] [property=WWE] [directPaging=0|2]
 *
 * MSNP11:
 *   <- PRP [property=PHH] [homePhoneNumber?]
 *   <- PRP [property=PHW] [workPhoneNumber?]
 *   <- PRP [property=PHM] [mobilePhoneNumber?]
 *   <- PRP [property=MOB] [contactOnMobile=N|Y]
 *   <- PRP [property=MBE] [isMobileEnabled=N|Y]
 *   <- PRP [property=WWE] [directPaging=0|2]
 *   <- PRP [property=MFN] [friendlyName]
 *   <- PRP [property=HSB] [hasBlog=0|1]
 */
const handleSYN_UserProperties = async (user: PulseUser, cmd: PulseCommand) => {}

/*
 * MSNP7:
 *   <- LSG [trId] [serverSyncId] [groupIdx] [totalGroups] [GroupName] [unk=0]
 *
 * MSNP11:
 *   <- LSG [groupName] [groupGUID]
 */
const handleSYN_ContactGroups = async (user: PulseUser, cmd: PulseCommand) => {}

/*
 * Contact Lists:
 *   MSNP2:
 *     <- LST [trId] [serverSyncId] [listType=FL|RL|AL|BL] [listVerId] [userIdx] [totalUsers] [passport?] [friendlyName?] [groupIds[,]?]
 *
 *   MSNP11:
 *    <- LST N=[passport] F=[friendlyName] C=[contactGUID] [listBitFlags] [groupGUIDs[,]]
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
const handleSYN_ContactsLists = async (user: PulseUser, cmd: PulseCommand) => {}
