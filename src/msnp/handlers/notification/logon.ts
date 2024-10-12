import { timingSafeStringCompare } from '@lxpt/azureflare'
import { populatePulseDataBySN } from '../../../database/queries/populate'
import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { AuthMethods, AuthMethodsT, AuthStages, AuthStagesT } from '../../protocol/constants'
import { generateMD5Password, getSNfromMail, makeEmailFromSN } from '../../util'
import { PulseContext } from '../../framework/client'
import { ErrorCode } from '../../protocol/error_codes'
import { logging } from '../../../utils/logging'

/* <> VER [trId] [MSNP(N)] CVR0 */
export const handleVER = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.TrId === -1) {
		user.error('Client not provided a CVR0 to command')
		return user.client.ns.quit()
	}

	// toUpperCase is just excessive insurance, never assume!
	const cvr0Index = cmd.Args.findIndex((arg) => arg.toUpperCase() === 'CVR0')
	if (cvr0Index === -1) {
		user.error('Client not provided a CVR0 to command')
		user.client.ns.reply(cmd, [0])
		return user.client.ns.quit()
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
			'Client did not provide a supported protocol version! Request was:',
			clVersions.join(', ')
		)
		user.client.ns.reply(cmd, [0])
		return user.client.ns.quit()
	}

	// Sort desecendingly
	validClVrs.sort((a, b) => parseInt(b.substring(4), 10) - parseInt(a.substring(4), 10))
	user.info('Client has reported following supported versions:', validClVrs)

	user.context = new PulseContext()
	user.context.messenger.dialect = parseInt(validClVrs[0].substring(4))

	return user.client.ns.reply(cmd, [...validClVrs, 'CVR0'])
}

/*
 * MSNP2 - MSNP7:
 *   -> INF [trId]
 *   <- INF [trId] [AuthProvider(N)]
 *
 * MSNP8+:
 *   - Command is Disabled -
 */
export const handleINF = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.TrId === -1) {
		user.error('Client not provided a CVR0 to command')
		return user.client.ns.quit()
	}

	if (user.context.messenger.dialect >= 8) {
		user.warn('Client tried to use legacy authentication selector')
		return user.client.ns.fatal(cmd, ErrorCode.DisabledCommand)
	}

	const authProv = user.context.messenger.dialect === 2 ? 'CTP' : 'MD5'

	user.info('Client authentication method was chosen to be:', authProv)
	return user.client.ns.reply(cmd, [authProv])
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

	if (cmd.TrId === -1) {
		user.error('Client not provided a CVR0 to command')
		return user.client.ns.quit()
	}

	if (!cmd.Args.length || cmd.Args.length < 2) {
		user.error('Client not provide enough/any arguments')
		return user.client.ns.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	const method = cmd.Args[0] as AuthMethodsT
	const stage = cmd.Args[1]

	if (stage !== AuthStages.Initial && stage !== AuthStages.Subsequent && stage !== AuthStages.Auth) {
		user.error('Client provided invalid auth stage')
		return user.client.ns.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	const handler = handlers.get(method)

	if (!handler) {
		user.error('Client provided an invalid authentication method!')
		return user.client.ns.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	user.nsDebug('USR Handler', 'Processing authentication method:', [method, stage].join('-'))
	const loggedIn = await handler(user, cmd)
	if (!loggedIn) {
		return user.client.ns.fatal(cmd, ErrorCode.ServerIsBusy)
	}

	if (loggedIn === AuthStages.Disabled) {
		return user.client.ns.fatal(cmd, ErrorCode.DisabledCommand)
	}

	if (loggedIn === AuthStages.OK) {
		user.context.messenger.authMethod = method
		user.data.user.LastLogin = new Date()

		const passport = makeEmailFromSN(user.data.account.ScreenName)
		user.info('Client has successfully logged-in as:', user.data.account.ScreenName)

		// MSNP10+
		if (user.context.messenger.dialect >= 10) {
			return user.client.ns.reply(cmd, ['OK', passport, user.data.account.IsVerified, 0])
		}

		// MSNP8 - MSNP9
		if (user.context.messenger.dialect >= 8) {
			return user.client.ns.reply(cmd, [
				'OK',
				passport,
				encodeURIComponent(user.data.user.DisplayName),
				user.data.account.IsVerified,
				0,
			])
		}

		// MSNP2 - MSNP7
		{
			return user.client.ns.reply(cmd, [
				'OK',
				passport,
				encodeURIComponent(user.data.user.DisplayName),
			])
		}
	}
}

/*
 * MSNP2:
 *   -> USR [trId] [Method=CTP] [Stage=I] [Mail] [Password]
 *
 * MSNP3+:
 *   - Command is Disabled-
 */
const handleUSR_CTP = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	if (user.context.messenger.dialect > 2) {
		user.warn(
			'Client attempted to login via CTP auth using unsupported dialect',
			user.context.messenger.dialect
		)
		return AuthStages.Disabled
	}

	const stage = cmd.Args[1]
	if (stage !== AuthStages.Initial) {
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

/*
 * MSNP3 - MSNP7:
 *   -> USR [trId] [Method=MD5] [Stage=I] [Mail]
 *   <- USR [trId] [Method=MD5] [Stage=S] [ChallengeToken]
 *   -> USR [trId] [Method=MD5] [Stage=S] [HashedResponse]
 *
 * MSNP2 & MSNP8+:
 *   - Command is Disabled -
 */
const handleUSR_MD5 = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	if (user.context.messenger.dialect >= 8 && user.context.messenger.dialect <= 2) {
		user.warn(
			'Client attempted to login via MD5 auth using unsupported dialect',
			user.context.messenger.dialect
		)
		return AuthStages.Disabled
	}

	const stage = cmd.Args[1]
	if (stage !== AuthStages.Initial && stage !== AuthStages.Subsequent) {
		user.error('Client provided unsupported auth stage for MD5')
		return AuthStages.Error
	}

	if (stage === AuthStages.Initial) {
		const screenname = getSNfromMail(cmd.Args[2])
		const data = await populatePulseDataBySN(screenname)
		if (!data) {
			user.error('Client provided an invalid e-mail address!')
			return AuthStages.Error
		}
		user.data = data

		user.nsDebug('USR/MD5-I', 'salt as guid', user.data.account.GUID)

		user.client.ns.reply(cmd, ['MD5', 'S', user.data.account.GUID])
		return AuthStages.Subsequent
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

/*
 * MSNP8 - MSNP14
 *   -> USR [trId] [Method=TWN] [Stage=I] [Mail]
 *   <- USR [trId] [Method=TWN] [Stage=S] [TokenParams]
 *   -> USR [trId] [Method=TWN] [Stage=S] [GeneratedToken]
 *
 * MSNP2 - MSNP7 & MSNP15+:
 *   - Command is Disabled -
 */
const handleUSR_TWN = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	if (user.context.messenger.dialect <= 7 && user.context.messenger.dialect > 14) {
		user.warn(
			'Client attempted to login via TWN auth using unsupported dialect',
			user.context.messenger.dialect
		)
		return AuthStages.Disabled
	}

	return AuthStages.Error
}

/*
 * MSNP15 - MSNP20:
 *   -> USR [trId] [Method=SSO] [Stage=I] [Mail]
 *   <- USR [trId] [Method=SSO] [Stage=S] [Policy] [ChallengeToken]
 *
 * MSNP2 - MSNP14 & MSNP21+:
 *   - Command is Disabled -
 */
const handleUSR_SSO = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	if (user.context.messenger.dialect <= 14 && user.context.messenger.dialect > 21) {
		user.warn(
			'Client attempted to login via SSO auth using unsupported dialect',
			user.context.messenger.dialect
		)
		return AuthStages.Disabled
	}

	return AuthStages.Error
}

/*
 * MSNP17+:
 *   -> USR [trId] [Method=SHA] [Stage=A] [CircleTicket]
 *
 * MSNP2 - MSNP16:
 *   - Command is Disabled -
 */
const handleUSR_SHA = async (user: PulseUser, cmd: PulseCommand): Promise<AuthStagesT> => {
	if (user.context.messenger.dialect <= 16) {
		user.warn(
			'Client attempted to login via SHA auth using unsupported dialect',
			user.context.messenger.dialect
		)
		return AuthStages.Disabled
	}

	return AuthStages.Error
}

export const handleOUT = async (user: PulseUser, cmd: PulseCommand) => {
	return user.client.ns.echo(cmd)
}
