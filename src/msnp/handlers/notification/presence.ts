import { activeUsers } from '../../+msnp'
import { getContactByIDs } from '../../../database/queries/lists'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { PresenceCmds } from '../../protocol/commands'
import { ErrorCode } from '../../protocol/error_codes'
import { OnlineStatus, OnlineStatusT } from '../../protocol/presence'
import { ListBitFlags } from '../../protocol/sync'
import { getPulseUserByUID, loadTemplate, makeEmailFromSN } from '../../util'

/*
 * MSNP2 - MSNP7:
 *   -> CVR [trId] [localeId] [osType] [osVersion] [cpuArch] [libName] [clientVer] [clientName]
 *
 * MSNP8+:
 *   -> CVR [trId] [localeId] [osType] [osVersion] [cpuArch] [libName] [clientVer] [clientName] [passport]
 *
 * <- CVR [trId] [recVer] [recVer2=recVer] [minVer] [downloadUrl] [infoUrl]
 */
export const handleCVR = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID')
		return user.client.ns.quit()
	}

	if (cmd.Args.length <= 0 || cmd.Args.length > 8) {
		user.error('Client provided invalid number of arguments')
		return user.client.ns.fatal(cmd, ErrorCode.BadCVRFormatting)
	}

	// context.machine
	{
		user.context.machine.localeId = parseInt(cmd.Args[0], 16)
		if (isNaN(user.context.machine.localeId)) {
			user.error('Client provided invalid localeId')
			return user.client.ns.fatal(cmd, ErrorCode.BadCVRParameters)
		}

		user.context.machine.osType = cmd.Args[1]
		user.context.machine.osVersion = cmd.Args[2]
		user.context.machine.cpuArch = cmd.Args[3]
	}

	// context.messenger
	{
		user.context.messenger.intrLibName = cmd.Args[4]
		user.context.messenger.version = cmd.Args[5]
		user.context.messenger.intrCliName = cmd.Args[6]
	}

	return await handleCVQ(user, cmd)
}

/*
 * MSNP2 - MSNP7:
 *   -> CVQ [trId] [localeId] [osType] [osVersion] [cpuArch] [libName] [clientVer] [clientName]
 *
 * MSNP8+:
 *   -> CVQ [trId] [localeId] [osType] [osVersion] [cpuArch] [libName] [clientVer] [clientName] [passport]
 */
export const handleCVQ = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID')
		return user.client.ns.quit()
	}

	const ver = cmd.Args[5]
	const url = 'https://remsgr.net'

	return user.client.ns.reply(cmd, [ver, ver, '1.0.0000', url, url])
}

/*
 * MSNP2 - MSNP7:
 *   <> CHG [trId] [status]
 *
 * MSNP8:
 *   <> CHG [trId] [status] [msnc_clientCaps]
 *
 * MSNP9+:
 *   <> CHG [trId] [status] [msnc_clientCaps] [msnc_objectDesc]
 *
 * - Calls ILN for Initial Presence -
 *   |- Calls UBX for Intial Presence -
 *
 * - Calls NLN/FLN for Async Presence -
 */
export const handleCHG = async (user: PulseUser, cmd: PulseCommand) => {
	const onError = () => {
		if (!user.context.state.initialStatus) {
			return user.client.ns.fatal(cmd, ErrorCode.InvalidParameter)
		}

		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID')
		return user.client.ns.quit()
	}

	if (!Object.values(OnlineStatus).includes(cmd.Args[0] as OnlineStatus)) {
		user.error('Client tried to use an invalid online status!')
		return onError()
	}

	const status = cmd.Args[0] as OnlineStatusT
	if (status === OnlineStatus.Offline) {
		user.error('Client tried to use set FLN as the status!')
		return onError()
	}

	if (!user.context.state.initialStatus) {
		await handleILN(user, cmd)
	}

	if (user.context.messenger.dialect >= 8) {
		user.context.state.clientCaps = cmd.Args[1]
	}

	if (user.context.messenger.dialect >= 9) {
		user.context.state.pfpObject = cmd.Args[2]
	}

	user.context.state.onlineStatus = status
	await handleCHG_Async(user, cmd)

	return user.client.ns.echo(cmd)
}

/*
 * - Calls NLN/FLN for Async Presence -
 */
export const handleCHG_Async = async (user: PulseUser, cmd: PulseCommand) => {
	// TODO: Revisit when Privacy Settings are implemented properly

	for (const contact of user.data.list) {
		if (!(contact.ListBits & ListBitFlags.Allow)) {
			continue
		}

		const clUser = getPulseUserByUID(contact.ContactID)
		if (!clUser) {
			continue
		}

		const clListEntry = clUser.data.list.find((entry) => entry.ContactID === user.data.account.UID)
		if (!clListEntry) {
			continue
		}

		if (!(clListEntry.ListBits & ListBitFlags.Forward)) {
			continue
		}

		if (user.context.state.onlineStatus === OnlineStatus.Hidden) {
			await handleFLN(user, clUser)
			continue
		}

		await handleNLN(user, clUser)
	}
}

/*
 * MSNP2 - MSNP7:
 *   <- NLN [status] [passport] [friendlyName]
 *
 * MSNP8:
 *   <- NLN [status] [passport] [friendlyName] [msnc_clientCaps]
 *
 * MSNP9 - MSNP13:
 *   <- NLN [status] [passport] [friendlyName] [msnc_clientCaps] [msnc_objectDesc]
 *
 * MSNP14+:
 *   <- NLN [status] [passport] [networkId] [friendlyName] [msnc_clientCaps] [msnc_objectDesc]
 */
export const handleNLN = async (user: PulseUser, contact: PulseUser) => {
	// MSNP14+
	if (contact.context.messenger.dialect >= 14) {
		return contact.client.ns.untracked(PresenceCmds.OnlineStatus, [
			user.context.state.onlineStatus,
			makeEmailFromSN(user.data.account.ScreenName),
			1, // todo networkId impl
			user.data.user.DisplayName,
			user.context.state.clientCaps,
			user.context.state.pfpObject,
		])
	}

	// MSNP9 - MSNP13
	if (contact.context.messenger.dialect >= 9) {
		return contact.client.ns.untracked(PresenceCmds.OnlineStatus, [
			user.context.state.onlineStatus,
			makeEmailFromSN(user.data.account.ScreenName),
			user.data.user.DisplayName,
			user.context.state.clientCaps,
			user.context.state.pfpObject,
		])
	}

	// MSNP8
	if (user.context.messenger.dialect >= 8) {
		return contact.client.ns.untracked(PresenceCmds.OnlineStatus, [
			user.context.state.onlineStatus,
			makeEmailFromSN(user.data.account.ScreenName),
			user.data.user.DisplayName,
			user.context.state.clientCaps,
		])
	}

	// MSNP2 - MSNP7
	{
		return contact.client.ns.untracked(PresenceCmds.OnlineStatus, [
			user.context.state.onlineStatus,
			makeEmailFromSN(user.data.account.ScreenName, contact.context.messenger.dialect === 2),
			user.data.user.DisplayName,
		])
	}
}

/*
 * MSNP2 - MSNP13:
 *   <- FLN [passport]
 *
 * MSNP14+:
 *   <- FLN [passport] [networkId]
 */
export const handleFLN = async (user: PulseUser, contact: PulseUser) => {
	// MSNP14+
	if (contact.context.messenger.dialect >= 14) {
		return contact.client.ns.untracked(PresenceCmds.OfflineStatus, [
			makeEmailFromSN(user.data.account.ScreenName),
			1, // todo networkId impl
		])
	}

	// MSNP2 - MSNP13
	{
		return contact.client.ns.untracked(PresenceCmds.OfflineStatus, [
			makeEmailFromSN(user.data.account.ScreenName, contact.context.messenger.dialect === 2),
		])
	}
}

/*
 * MSNP2 - MSNP7:
 *   <- ILN [trId] [status] [passport] [friendlyName]
 *
 * MSNP8:
 *   <- ILN [trId] [status] [passport] [friendlyName] [msnc_clientCaps]
 *
 * MSNP9 - MSNP13:
 *   <- ILN [trId] [status] [passport] [friendlyName] [msnc_clientCaps] [msnc_objectDesc]
 *
 * MSNP14+:
 *   <- ILN [trId] [status] [passport] [networkId] [friendlyName] [msnc_clientCaps] [msnc_objectDesc]
 */
export const handleILN = async (user: PulseUser, cmd: PulseCommand) => {
	let shouldLog = false
	for (const contact of user.data.list) {
		if (!(contact.ListBits & ListBitFlags.Forward) || !(contact.ListBits & ListBitFlags.Allow)) {
			continue
		}

		const clUser = getPulseUserByUID(contact.ContactID)
		if (!clUser) {
			continue
		}

		if (
			clUser.context.state.onlineStatus === OnlineStatus.Hidden ||
			clUser.context.state.onlineStatus === OnlineStatus.Offline
		) {
			continue
		}

		// MSNP14+
		if (user.context.messenger.dialect >= 14) {
			user.client.ns.send(PresenceCmds.InitialStatus, cmd.TrId, [
				clUser.context.state.onlineStatus,
				makeEmailFromSN(clUser.data.account.ScreenName),
				1, // todo networkId impl
				clUser.data.user.DisplayName,
				clUser.context.state.clientCaps,
				clUser.context.state.pfpObject,
			])
			continue
		}

		// MSNP9 - MSNP13
		if (user.context.messenger.dialect >= 9) {
			user.client.ns.send(PresenceCmds.InitialStatus, cmd.TrId, [
				clUser.context.state.onlineStatus,
				makeEmailFromSN(clUser.data.account.ScreenName),
				clUser.data.user.DisplayName,
				clUser.context.state.clientCaps,
				clUser.context.state.pfpObject,
			])

			if (user.context.messenger.dialect >= 11) {
				await handleUBX(user, clUser.data.account.ScreenName)
			}
			continue
		}

		// MSNP8
		if (user.context.messenger.dialect >= 8) {
			user.client.ns.send(PresenceCmds.InitialStatus, cmd.TrId, [
				clUser.context.state.onlineStatus,
				makeEmailFromSN(clUser.data.account.ScreenName),
				clUser.data.user.DisplayName,
				clUser.context.state.clientCaps,
			])
			continue
		}

		// MSNP2 - MSNP7
		{
			user.client.ns.send(PresenceCmds.InitialStatus, cmd.TrId, [
				clUser.context.state.onlineStatus,
				makeEmailFromSN(clUser.data.account.ScreenName, user.context.messenger.dialect === 2),
				clUser.data.user.DisplayName,
			])
		}

		shouldLog = true
	}

	user.context.state.initialStatus = true
	if (shouldLog) {
		user.info('Finished sending initial presence info!')
	}
}

/*
 * MSNP11:
 *  <- UBX [passport] [payloadLen] \r\n [payloadData]
 *
 * MSNP14:
 *  <- UBX [passport] [networkId] [payloadLen] \r\n [payloadData]
 */
export const handleUBX = async (user: PulseUser, passport: string) => {
	// MSNP14+
	if (user.context.messenger.dialect >= 14) {
		// TODO: Impl NetworkID (1)
		return user.client.ns.payload(
			PresenceCmds.GetExtendedStatus,
			[makeEmailFromSN(passport), 1, user.context.state.ubxStatus.length],
			user.context.state.ubxStatus.toString()
		)
	}

	// MSNP11 - MSNP13
	{
		return user.client.ns.payload(
			PresenceCmds.GetExtendedStatus,
			[makeEmailFromSN(passport), user.context.state.ubxStatus.length],
			user.context.state.ubxStatus.toString()
		)
	}
}
