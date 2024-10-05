import { activeUsers } from './+msnp'
import crypto from 'node:crypto'

export const getPulseUserByUID = (uid: number) => activeUsers[uid]
export const deletePulseUserByUID = (uid: number) => delete activeUsers[uid]

export const generateMD5Password = (password: string, salt: string) => {
	const md5 = crypto.createHash('md5')
	md5.update(salt + password)
	return md5.digest('hex')
}

export const getSNfromMail = (email: string) => email.split('@')[0]
