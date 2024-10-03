import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Accounts } from '../models/account'
import { Lists } from '../models/list'

export const getListsByUID = async (uid: number) =>
	await getDB().db.select().from(Lists).where(eq(Lists.UID, uid))
