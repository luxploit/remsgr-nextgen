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

export const getProtoNumber = (user: PulseUser) => {
	const protoVer = user.client.infoContext.protocolVersion
	if (!protoVer) {
		return -1
	}

	const protoNum = parseInt(protoVer.substring(4))
	return !isNaN(protoNum) ? protoNum : -1
}
