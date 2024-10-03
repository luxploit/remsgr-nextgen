//import { UserModel } from '../../../database/models/user'
import { getDB } from '../../../database/+database'
import { Accounts } from '../../../database/models/account'
import { getAccountBySN } from '../../../database/queries/account'
import { populatePulseDataBySN } from '../../../database/queries/populate'
import { PulseAuthenticationMethods, PulseClientInfoContext } from '../../framework/client'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { AuthStages, Errors } from '../../protocol/constants'
import { deletePulseUserByUID, generateMD5Password, getPulseUserByUID, getSNfromMail } from '../../util'

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

	user.client.infoContext = new PulseClientInfoContext()
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
	const handlers = new Map<string, (user: PulseUser, cmd: PulseCommand) => Promise<boolean>>([
		['CTP', handleUSR_CTP],
		['MD5', handleUSR_MD5],
		['TWN', handleUSR_TWN],
		['SSO', handleUSR_SSO],
		['SHA', handleUSR_SHA],
	])

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

	const handler = handlers.get(method)

	if (!handler) {
		user.error('Client provided an invalid authentication method!')
		return user.client.notification.fatal(cmd, Errors.ServerIsBusy)
	}

	const loggedIn = await handler(user, cmd)

	if (!loggedIn) return user.client.notification.fatal(cmd, Errors.ServerIsBusy)

	user.client.notification.send(cmd, ['OK', 1, 0])
}

/* -> USR [trId] [Method=CTP] [Stage=I] [Mail] [Password] */
export const handleUSR_CTP = async (user: PulseUser, cmd: PulseCommand) => {
	const stage = cmd.Args[1]
	if (stage !== AuthStages.Input) {
		user.error('Client provided unsupported auth stage for CTP')
		return false
	}

	const screenname = getSNfromMail(cmd.Args[2])
	const data = await populatePulseDataBySN(screenname)
	if (!data) {
		user.error('Client provided an invalid e-mail address!')
		return false
	}
	user.data = data

	const password = cmd.Args[3]
	const hashedPw = generateMD5Password(password, user.data.account.GUID)
	console.log(hashedPw)

	if (hashedPw !== user.data.account.PasswordMD5) {
		user.error('Client has entered invalid credentials!')
		return false
	}

	return true
}

/* -> USR [trId] [Method=MD5] [Stage=I] [Mail]  */
/* <- USR [trId] [Method=MD5] [Stage=S] [ChallengeToken]  */
/* -> USR [trId] [Method=MD5] [Stage=S] [HashedResponse] */
export const handleUSR_MD5 = async (user: PulseUser, cmd: PulseCommand) => {
	const stage = cmd.Args[1]
	if (stage !== AuthStages.Input && stage !== AuthStages.Salt) {
		user.error('Client provided unsupported auth stage for MD5')
		return false
	}

	if (stage === AuthStages.Input) {
		const screenname = getSNfromMail(cmd.Args[2])
		const data = await populatePulseDataBySN(screenname)
		if (!data) {
			user.error('Client provided an invalid e-mail address!')
			return false
		}
		user.data = data
	}

	return true
}

/* -> USR [trId] [Method=TWN] [Stage=I] [Mail] */
/* <- USR [trId] [Method=TWN] [Stage=S] [TokenParams] */
/* -> USR [trId] [Method=TWN] [Stage=S] [GeneratedToken] */
export const handleUSR_TWN = async (user: PulseUser, cmd: PulseCommand) => {
	return true
}

/* -> USR [trId] [Method=SSO] [Stage=I] [Mail] */
/* <- USR [trId] [Method=SSO] [Stage=S] [Policy] [ChallengeToken] */
export const handleUSR_SSO = async (user: PulseUser, cmd: PulseCommand) => {
	return true
}

/* -> USR [trId] [Method=SHA] [Stage=A] [CircleTicket] */
export const handleUSR_SHA = async (user: PulseUser, cmd: PulseCommand) => {
	return true
}
