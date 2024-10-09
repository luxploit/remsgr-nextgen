import { activeUsers } from './+msnp'
import crypto from 'node:crypto'
import { PulseUser } from './framework/user'
import { PulseCommand } from './framework/decoder'

export const getPulseUserByUID = (uid: number) => activeUsers[uid]
export const deletePulseUserByUID = (uid: number) => delete activeUsers[uid]

export const generateMD5Password = (password: string, salt: string) => {
	const md5 = crypto.createHash('md5')
	md5.update(salt + password)
	return md5.digest('hex')
}

export const getSNfromMail = (email: string) => email.split('@')[0]
export const makeEmailFromSN = (sn: string) => sn + '@remsgr.net'

export const getClVersions = (user: PulseUser, cmd: PulseCommand) => {
	const clientCl = parseInt(cmd.Args[0])
	return {
		client: !isNaN(clientCl) ? clientCl : -1,
		server: user.data.user.ClVersion,
	}
}

export const getModernSYNTimestamp = () => {
	const date = new Date()
	return date.toISOString().replace('Z', '-00:00')
}

export const sendSyncCmd = (
	user: PulseUser,
	cmd: string,
	trId: number,
	args?: Array<string | number>
) => {
	if (user.context.protoDialect >= 11) {
		user.client.ns.untracked(cmd, args)
	} else {
		user.client.ns.send(cmd, trId, [user.data.user.ClVersion, ...(args ?? [])])
	}
}
