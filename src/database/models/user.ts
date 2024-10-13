import { integer, jsonb, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'
import { UUID } from 'node:crypto'

export interface GenericGroup {
	guid: UUID
	name: string
}

export const Users = pgTable('users', {
	UID: serial('uid')
		.primaryKey()
		.references(() => Accounts.UID),
	DisplayName: varchar('display_name', { length: 387 }).unique().notNull(),
	ContactGroups: jsonb('contact_groups').$type<GenericGroup>().array(),
	PrivacyFlags: integer('privacy_flags').notNull().default(0),
	ClVersion: integer('cl_version').notNull().default(0),
	LastLogin: timestamp('last_login'),
	SignupDate: timestamp('signup_date').notNull().defaultNow(),
	LastModified: timestamp('last_modified')
		.defaultNow()
		.notNull()
		.$onUpdate(() => new Date()),
})

export type UsersT = typeof Users.$inferSelect
