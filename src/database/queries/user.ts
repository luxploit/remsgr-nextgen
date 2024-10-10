import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Users } from '../models/user'

export const getUserByUID = async (uid: number) =>
	(await getDB().db.select().from(Users).where(eq(Users.UID, uid))).at(0)

export const updateUserClVersionByUID = async (uid: number, clVer: number) =>
	await getDB().db.update(Users).set({ ClVersion: clVer })
