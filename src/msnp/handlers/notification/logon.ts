import { timingSafeStringCompare } from '@lxpt/azureflare'
import { populatePulseDataBySN } from '../../../database/queries/populate'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { AuthMethods, AuthMethodsT, AuthStages, AuthStagesT, Errors } from '../../protocol/constants'
import { generateMD5Password, getSNfromMail, makeEmailFromSN } from '../../util'
import { PulseClientInfoContext } from '../../framework/client'

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
		user.error(
			'Client did not provide a support protocol version! Request was:',
			clVersions.join(', ')
		)
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
	const handlers = new Map<AuthMethodsT, (user: PulseUser, cmd: PulseCommand) => Promise<AuthStagesT>>(
		[
			[AuthMethods.PlainText, handleUSR_CTP],
			[AuthMethods.SaltedMD5, handleUSR_MD5],
			[AuthMethods.Tweener, handleUSR_TWN],
			[AuthMethods.SingleSignOn, handleUSR_SSO],
			[AuthMethods.CircleTicket, handleUSR_SHA],
		]
	)

	if (!cmd.Args.length || cmd.Args.length < 2) {
		user.error('Client not provide enough/any arguments')
		return user.client.notification.fatal(cmd, Errors.ServerIsBusy)
	}

	const method = cmd.Args[0] as AuthMethodsT
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

	user.nsDebug('USR Handler', 'Processing authentication method:', [method, stage].join('-'))
	const loggedIn = await handler(user, cmd)
	if (!loggedIn) {
		return user.client.notification.fatal(cmd, Errors.ServerIsBusy)
	}

	if (loggedIn === AuthStages.OK) {
		user.client.infoContext.authenticationMethod = method
		user.data.user.LastLogin = new Date()

		user.info('Client has successfully logged-in as:', makeEmailFromSN(user.data.account.ScreenName))
		return user.client.notification.send(cmd, ['OK', 1, 0])
	}
}

/* -> USR [trId] [Method=CTP] [Stage=I] [Mail] [Password] */
const handleUSR_CTP = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	const stage = cmd.Args[1]
	if (stage !== AuthStages.Input) {
		user.error('Client provided unsupported auth stage for CTP')
		return AuthStages.Error
	}

	const screenname = getSNfromMail(cmd.Args[2])
	const data = await populatePulseDataBySN(screenname)
	if (!data) {
		user.error('Client provided an invalid e-mail address!')
		return AuthStages.Error
	}
	user.data = data

	const password = cmd.Args[3]
	const hashedPw = generateMD5Password(password, user.data.account.GUID)

	user.nsDebug('USR/CTP-I', 'plainPw', password)
	user.nsDebug('USR/CTP-I', 'hashedPw', hashedPw)
	user.nsDebug('USR/CTP-I', 'databasePw', user.data.account.PasswordMD5)

	if (!timingSafeStringCompare(hashedPw, user.data.account.PasswordMD5)) {
		user.error('Client has entered invalid credentials!')
		return AuthStages.Error
	}

	return AuthStages.OK
}

/* -> USR [trId] [Method=MD5] [Stage=I] [Mail]  */
/* <- USR [trId] [Method=MD5] [Stage=S] [ChallengeToken]  */
/* -> USR [trId] [Method=MD5] [Stage=S] [HashedResponse] */
const handleUSR_MD5 = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	const stage = cmd.Args[1]
	if (stage !== AuthStages.Input && stage !== AuthStages.Salt) {
		user.error('Client provided unsupported auth stage for MD5')
		return AuthStages.Error
	}

	if (stage === AuthStages.Input) {
		const screenname = getSNfromMail(cmd.Args[2])
		const data = await populatePulseDataBySN(screenname)
		if (!data) {
			user.error('Client provided an invalid e-mail address!')
			return AuthStages.Error
		}
		user.data = data

		user.nsDebug('USR/MD5-I', 'salt as guid', user.data.account.GUID)

		user.client.notification.send(cmd, ['MD5', 'S', user.data.account.GUID])
		return AuthStages.Salt
	}

	const hashedPw = cmd.Args[2]

	user.nsDebug('USR/MD5-S', 'hashedPw', hashedPw)
	user.nsDebug('USR/MD5-S', 'databasePw', user.data.account.PasswordMD5)

	if (!timingSafeStringCompare(hashedPw, user.data.account.PasswordMD5)) {
		user.error('Client has sent an invalid hashed response!')
		return AuthStages.Error
	}

	return AuthStages.OK
}

/* -> USR [trId] [Method=TWN] [Stage=I] [Mail] */
/* <- USR [trId] [Method=TWN] [Stage=S] [TokenParams] */
/* -> USR [trId] [Method=TWN] [Stage=S] [GeneratedToken] */
const handleUSR_TWN = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	return AuthStages.Error
}

/* -> USR [trId] [Method=SSO] [Stage=I] [Mail] */
/* <- USR [trId] [Method=SSO] [Stage=S] [Policy] [ChallengeToken] */
const handleUSR_SSO = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	return AuthStages.Error
}

/* -> USR [trId] [Method=SHA] [Stage=A] [CircleTicket] */
const handleUSR_SHA = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	return AuthStages.Error
}
