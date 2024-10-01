import { UserModel } from '../../../database/models/user'
import { PulseAuthenticationMethods } from '../../framework/client'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { AuthStages, Errors } from '../../protocol/constants'

/* <> VER [trId] [MSNP(N)] CVR0 */
export const handleVER = async (user: PulseUser, cmd: PulseCommand) => {
	// toUpperCase is just to excessive insurance, never assume!
	const cvr0Index = cmd.Args.findIndex((arg) => arg.toUpperCase() === 'CVR0')
	if (cvr0Index === -1) {
		user.error('Client not provided a CVR0 to command')
		user.client.notification.send(cmd, [0])
		return user.client.notification.quit()
	}

	const clVersions = cmd.Args.slice(0, cvr0Index)
	const validClVrs: string[] = []
	for (let clVer of clVersions) {
		let intVer = parseInt(clVer.substring(4), 10)
		if (isNaN(intVer) || intVer < 2 || intVer > 24) continue

		validClVrs.push(clVer)
	}

	if (!validClVrs.length) {
		user.error('Client did not provide a support protocol version! Request was:', clVersions)
		user.client.notification.send(cmd, [0])
		return user.client.notification.quit()
	}

	// Sort desecendingly
	validClVrs.sort((a, b) => parseInt(b.substring(4), 10) - parseInt(a.substring(4), 10))
	user.info('Client has reported following supported versions:', validClVrs)

	user.client.infoContext.protocolVersion = validClVrs[0]
	return user.client.notification.send(cmd, [...validClVrs, 'CVR0'])
}

/* -> INF [trId] */
/* <- INF [trId] [AuthProvider] */
export const handleINF = async (user: PulseUser, cmd: PulseCommand) => {
	const authProv = user.client.infoContext.protocolVersion === 'MSNP2' ? 'CTP' : 'MD5'

	user.info('Client authentication method was chosen to be:', authProv)
	return user.client.notification.send(cmd, [authProv])
}

/*
 * CTP:
 *     -> USR [trId] [Method=CTP] [Stage=I] [Mail] [Password]
 * MD5:
 *     -> USR [trId] [Method=MD5] [Stage=I] [Mail]
 *     <- USR [trId] [Method=MD5] [Stage=S] [ChallengeToken]
 *     -> USR [trId] [Method=MD5] [Stage=S] [HashedResponse]
 * SHA:
 *     -> USR [trId] [Method=SHA] [Stage=A] [CircleTicket]
 * TWN:
 *     -> USR [trId] [Method=TWN] [Stage=I] [Mail]
 *     <- USR [trId] [Method=TWN] [Stage=S] [TokenParams]
 *     -> USR [trId] [Method=TWN] [Stage=S] [GeneratedToken]
 * SSO:
 *     -> USR [trId] [Method=SSO] [Stage=I] [Mail]
 *     <- USR [trId] [Method=SSO] [Stage=S] [Policy] [ChallengeToken]
 *
 * <- USR [trId] [Stage=OK] [Mail] [ScreenName]
 */
export const handleUSR = async (user: PulseUser, cmd: PulseCommand) => {
	if (!cmd.Args.length || cmd.Args.length < 2) {
		user.error('Client not provide enough/any arguments')
		return user.client.notification.fatal(cmd, Errors.ServerIsBusy)
	}

	const method = cmd.Args[0]
	const stage = cmd.Args[1]

	if (stage !== AuthStages.Input && stage !== AuthStages.Salt && stage !== AuthStages.Auth) {
		user.error('Client provided invalid auth stage')
		return user.client.notification.fatal(cmd, Errors.ServerIsBusy)
	}

	const emailAddress = cmd.Args[2]
	const userObj = await UserModel.findOne({ username: emailAddress })
}
