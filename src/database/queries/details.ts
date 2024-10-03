import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Details } from '../models/detail'

export const getDetailsByUID = async (uid: number) =>
	(await getDB().db.select().from(Details).where(eq(Details.UID, uid))).at(0)
