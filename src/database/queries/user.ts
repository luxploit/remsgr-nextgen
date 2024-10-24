import { eq } from 'drizzle-orm'
import { getDB } from '../+database'
import { Users } from '../models/user'

export const getUserByUID = async (uid: number) =>
	(await getDB().db.select().from(Users).where(eq(Users.UID, uid))).at(0)

export const updateUserClVersionByUID = async (uid: number, clVer: number) =>
	await getDB().db.update(Users).set({ ClVersion: clVer }).where(eq(Users.UID, uid))

export const updateUserLastLoginByUID = async (uid: number, loginDate: Date) =>
	await getDB().db.update(Users).set({ LastLogin: loginDate }).where(eq(Users.UID, uid))

export const updateUserDisplayNameByUID = async (uid: number, friendlyName: string) =>
	await getDB().db.update(Users).set({ DisplayName: friendlyName }).where(eq(Users.UID, uid))

export const updateUserAvailablityPrivacyByUID = async (uid: number, option: boolean) =>
	await getDB().db.update(Users).set({ AvailablityPrivacy: option }).where(eq(Users.UID, uid))

export const updateUserListChangesNotificationByUID = async (uid: number, option: boolean) =>
	await getDB().db.update(Users).set({ ListChanges: option }).where(eq(Users.UID, uid))
