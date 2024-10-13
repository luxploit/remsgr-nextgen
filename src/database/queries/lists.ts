import { and, eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Accounts } from '../models/account'
import { Lists } from '../models/list'

export const getListsByUID = async (uid: number) =>
	await getDB().db.select().from(Lists).where(eq(Lists.UID, uid))

export const getContactByIDs = async (uid: number, cid: number) =>
	(
		await getDB()
			.db.select()
			.from(Lists)
			.where(and(eq(Lists.UID, uid), eq(Lists.ContactID, cid)))
	).at(0)
