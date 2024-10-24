import { boolean, integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'
import { UUID } from 'node:crypto'
import { PrivacyModes } from '../../msnp/protocol/sync'

export interface GenericGroup {
	guid: UUID
	name: string
}

// export interface UserSettings {
// 	listChanges: PrivacyModes.GTC_NotifyReverseList | PrivacyModes.GTC_IgnoreReverseList
// 	availablity: PrivacyModes.BLP_AllowEveryone | PrivacyModes.BLP_OnlyAllowList
// }

export const Users = pgTable('users', {
	UID: serial('uid')
		.primaryKey()
		.references(() => Accounts.UID),
	DisplayName: varchar('display_name', { length: 129 }).unique().notNull(),
	ContactGroups: jsonb('contact_groups').array().$type<GenericGroup[]>(),
	//PrivacyFlags: integer('privacy_flags').notNull().default(0),
	AvailablityPrivacy: boolean('availablity_privacy').default(true),
	ListChanges: boolean('list_changes').default(true),
	// PrivacyOptions: jsonb('privacy_options').$type<UserSettings>().notNull().default({
	// 	listChanges: PrivacyModes.GTC_NotifyReverseList,
	// 	availablity: PrivacyModes.BLP_AllowEveryone,
	// }),
	ClVersion: integer('cl_version').notNull().default(0),
	LastLogin: timestamp('last_login'),
	SignupDate: timestamp('signup_date').notNull().defaultNow(),
	LastModified: timestamp('last_modified')
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
})

export type UsersT = typeof Users.$inferSelect
