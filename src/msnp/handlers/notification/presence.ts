import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { ErrorCode } from '../../protocol/error_codes'

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
	if (cmd.Args.length <= 0 || cmd.Args.length > 8) {
		user.error('Client provided invalid number of arguments')
		return user.client.sb.fatal(cmd, ErrorCode.BadCVRFormatting)
	}

	// context.machine
	{
		user.context.machine.localeId = parseInt(cmd.Args[0], 16)
		if (isNaN(user.context.machine.localeId)) {
			user.error('Client provided invalid localeId')
			return user.client.sb.fatal(cmd, ErrorCode.BadCVRParameters)
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
 * -> CVQ [trId] [localeId] [osType] [osVersion] [cpuArch] [libName] [clientVer] [clientName] [passport]
 * <- CVQ [trId] [recVer] [recVer2=recVer] [minVer] [downloadUrl] [infoUrl]
 */
export const handleCVQ = async (user: PulseUser, cmd: PulseCommand) => {
	const ver = cmd.Args[5]
	const url = 'https://remsgr.net'

	return user.client.ns.reply(cmd, [ver, ver, ver, url, url])
}

/*
 * MSNP2 - MSNP8:
 *   <> CHG [trId] [status]
 *
 * MSNP9+:
 *   <> CHG [trId] [status] [msnc_clientCaps] [msnc_objectDesc]
 */
export const handleCHG = async (user: PulseUser, cmd: PulseCommand) => {
	user.context.state.onlineStatus = cmd.Args[0]
	return user.client.ns.echo(cmd)
}
