import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { PrivacyOptions, Users } from '../models/user'

export const getUserByUID = async (uid: number) =>
	(await getDB().db.select().from(Users).where(eq(Users.UID, uid))).at(0)

export const updateUserClVersionByUID = async (uid: number, clVer: number) =>
	await getDB().db.update(Users).set({ ClVersion: clVer }).where(eq(Users.UID, uid))

export const updateUserLastLoginByUID = async (uid: number, loginDate: Date) =>
	await getDB().db.update(Users).set({ LastLogin: loginDate }).where(eq(Users.UID, uid))

export const updateUserDisplayNameByUID = async (uid: number, friendlyName: string) =>
	await getDB().db.update(Users).set({ DisplayName: friendlyName }).where(eq(Users.UID, uid))

export const updateUserPrivacyOptionsByUID = async (uid: number, options: PrivacyOptions) =>
	await getDB().db.update(Users).set({ PrivacyOptions: options }).where(eq(Users.UID, uid))
