import { PulseCommand } from '../../framework/decoder'
import { PulseInteractableArgs } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import { MiscCmds } from '../../protocol/commands'
import { ErrorCode } from '../../protocol/error_codes'
import { ServiceUrls } from '../../protocol/misc'
import { loadTemplate } from '../../util'

/*
 * MSNP11 - MSNP12:
 *   -> GCF [trId] [fileName]
 *   <- GCF [trId] [fileName] [fileSize] \r\n [payload]
 *
 * MSNP2 - MSNP10 & MSNP13+:
 *   - Command is Disabled -
 */
export const handleGCF = async (user: PulseUser, cmd: PulseCommand) => {
	if (user.context.messenger.dialect < 11 || user.context.messenger.dialect >= 13) {
		user.warn(
			`Client tried to call GCF using an unsupported dialect MSNP${user.context.messenger.dialect}`
		)
		return user.client.ns.error(cmd, ErrorCode.DisabledCommand)
	}

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command GCF')
		return user.client.ns.quit()
	}

	if (cmd.Args.length !== 1) {
		user.error(`Client provided an invalid amount of arguments to command GCF`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const fileName = cmd.Args[0]
	return await handleGCF_Send(user, cmd.TrId, fileName)
}

/*
 * MSNP11:
 *   -> GCF [trId] [fileName]
 *   <- GCF [trId] [fileName] [fileSize] \r\n [payload]
 *
 * MSNP13:
 *   <- GCF [trId=0] [fileSize] \r\n [payload]
 *
 * MSNP2 - MSNP10:
 *   - Command is Disabled -
 */
export const handleGCF_Send = async (user: PulseUser, trId: number, fileName: string) => {
	if (user.context.messenger.dialect < 11) {
		return
	}

	const policyXml = await loadTemplate(fileName)

	// MSNP13+
	if (user.context.messenger.dialect >= 13) {
		return user.client.ns.payload(MiscCmds.PolicyConfiguration, [0, policyXml.length], policyXml)
	}

	// MSNP11 - MSNP12
	{
		return user.client.ns.payload(
			MiscCmds.PolicyConfiguration,
			[trId, fileName, policyXml.length],
			policyXml
		)
	}
}

/*
 * MSNP2:
 * -> URL [trId] [urlKey] [optionalLocale?]
 * <- URL [trId] [svcSubdomain] [authServer]
 *
 * MSNP3+:
 * -> URL [trId] [urlKey] [optionalLocale?]
 * <- URL [trId] [svcSubdomain] [authServer] [unkId]
 */
export const handleURL = async (user: PulseUser, cmd: PulseCommand) => {
	if (true) {
		return
	}

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command URL')
		return user.client.ns.quit()
	}

	if (cmd.Args.length < 1 || cmd.Args.length > 2) {
		user.error(`Client provided an invalid amount of arguments to command URL`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const urlKey = cmd.Args[0]
	if (!ServiceUrls.has(urlKey)) {
		user.error(`Client provided an invalid service url to command URL`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	const args: PulseInteractableArgs = [
		ServiceUrls.get(urlKey)!,
		// 'https://rest.spiritonline.net/api/msn/webauth',
		'https://remsgr.net',
	]

	if (user.context.messenger.dialect >= 3) {
		args.push(1)
	}

	return user.client.ns.reply(cmd, args)
}
