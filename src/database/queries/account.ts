import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Accounts } from '../models/account'

export const getAccountBySN = async (sn: string) =>
	(await getDB().db.select().from(Accounts).where(eq(Accounts.ScreenName, sn))).at(0)

export const getAccountByUID = async (uid: number) =>
	(await getDB().db.select().from(Accounts).where(eq(Accounts.UID, uid))).at(0)
