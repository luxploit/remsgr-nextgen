import { and, eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Accounts } from '../models/account'
import { Lists, ListsT } from '../models/list'

export const getListByUID = async (uid: number) =>
	await getDB().db.select().from(Lists).where(eq(Lists.UID, uid))

export const getListEntryByIDs = async (uid: number, cid: number) =>
	(
		await getDB()
			.db.select()
			.from(Lists)
			.where(and(eq(Lists.UID, uid), eq(Lists.ContactID, cid)))
	).at(0)

export const updateListEntryBitsByIDs = async (uid: number, cid: number, listBits: number) =>
	await getDB()
		.db.update(Lists)
		.set({ ListBits: listBits })
		.where(and(eq(Lists.UID, uid), eq(Lists.ContactID, cid)))

export const insertListEntry = async (entry: ListsT) => await getDB().db.insert(Lists).values(entry)
