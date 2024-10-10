import { activeUsers } from './+msnp'
import crypto from 'node:crypto'
import { PulseUser } from './framework/user'
import { PulseCommand } from './framework/decoder'
import { PulseInteractableArgs } from './framework/interactable'
import { ListsT } from '../database/models/list'
import { UsersT } from '../database/models/user'
import { populatePulseDataByUID } from '../database/queries/populate'
import { ListTypesT } from './protocol/constants'
import { ListTypes } from './protocol/sync'

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
	args?: PulseInteractableArgs
) => {
	if (user.context.protoDialect >= 8) {
		return user.client.ns.untracked(cmd, args)
	} else {
		return user.client.ns.send(cmd, trId, [user.data.user.ClVersion, ...(args ?? [])])
	}
}

export const getListVer = (listType: ListTypesT, user: UsersT) => {
	switch (listType) {
		case ListTypes.Forward:
			return user.FlVersion
		case ListTypes.Reverse:
			return user.RlVersion
		case ListTypes.Allow:
			return user.AlVersion
		case ListTypes.Block:
			return user.BlVersion
	}

	return 0
}

export const buildLegacyGroupIDsMap = (uuids: string[]) => {
	const mapping = new Map<string, number>()

	let groupIdx = 0
	for (const uuid of uuids) {
		mapping.set(uuid, groupIdx++)
	}

	return mapping
}

export const getLegacyGroupIDs = (lists: ListsT, groups: Map<string, number>) => {
	if (!lists.Groups) {
		return [0]
	}

	return lists.Groups.map((guid) => groups.get(guid)).filter((count) => count !== undefined)
}

// export const isSelfOnContactXL = (user: PulseUser, contact: PulseUser, listType: ListTypesT) => {
// 	const list = contact.data.list.filter(
// 		(pl) =>
// 			pl.ListType === listType &&
// 			pl.ContactID === user.data.account.UID &&
// 			pl.UID === contact.data.account.UID
// 	)

// 	return list.length === 1
// }

// export const isContactOnSelfXL = (user: PulseUser, contact: PulseUser, listType: ListTypesT) => {
// 	const list = contact.data.list.filter(
// 		(pl) =>
// 			pl.ListType === listType &&
// 			pl.ContactID === contact.data.account.UID &&
// 			pl.UID === user.data.account.UID
// 	)

// 	return list.length === 1
// }

export const createFakeContactUser = async (user: PulseUser, cid: number) => {
	const data = await populatePulseDataByUID(cid)
	if (!data) return null

	// Populate new contact
	const contact = new PulseUser()
	{
		contact.data = data
		contact.data.user.ClVersion = user.data.user.ClVersion // @hack
		contact.context = user.context
		contact.client = user.client
	}

	return contact
}
