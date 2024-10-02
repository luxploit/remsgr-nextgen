import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Accounts } from '../models/account'

export const getAccountByScreenName = async (sn: string) =>
	(await getDB().db.select().from(Accounts).where(eq(Accounts.ScreenName, sn))).at(0)
