import { integer, pgEnum, pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'

export const roleEnum = pgEnum('role', ['superuser', 'moderator', 'user'])

export const Users = pgTable('users', {
	UID: serial('uid')
		.primaryKey()
		.references(() => Accounts.UID),
	DisplayName: varchar('display_name', { length: 387 }).unique().notNull(),
	Groups: varchar('groups').array(),
	PrivacyFlags: integer('privacy_flags').notNull().default(0),
	Role: roleEnum('role'),
	ClVersion: integer('cl_version').notNull().default(0),
	LastLogin: timestamp('last_login'),
	SignupDate: timestamp('signup_date').notNull().defaultNow(),
	LastModified: timestamp('last_modified')
		.notNull()
		.$onUpdate(() => new Date()),
})

export type UsersT = typeof Users.$inferSelect
