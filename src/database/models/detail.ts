import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'

export const Details = pgTable('details', {
	UID: serial('uid')
		.primaryKey()
		.references(() => Accounts.UID),
	PhoneHome: varchar('phone_home', { length: 95 }),
	PhoneWork: varchar('phone_work', { length: 95 }),
	PhoneMobile: varchar('phone_mobile', { length: 95 }),
	LastModified: timestamp('last_modified')
		.notNull()
		.$onUpdate(() => new Date()),
})

export type DetailsT = typeof Details.$inferSelect
