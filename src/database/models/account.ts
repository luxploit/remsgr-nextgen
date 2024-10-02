import { pgTable, serial, varchar } from 'drizzle-orm/pg-core'

export const Accounts = pgTable('accounts', {
	uid: serial('uid').primaryKey(),
	screenname: varchar('screenname', { length: 24 }).unique().notNull(),
})
