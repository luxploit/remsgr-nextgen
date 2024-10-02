import { pgTable, serial, timestamp, varchar } from 'drizzle-orm/pg-core'

export const Accounts = pgTable('accounts', {
	UID: serial('uid').primaryKey(),
	ScreenName: varchar('screen_name', { length: 32 }).unique().notNull(),
	Email: varchar('email', { length: 128 }).unique().notNull(),
	PasswordMD5: varchar('password_md5', { length: 32 }).notNull(),
	PasswordSHA: varchar('password_sha224', { length: 64 }).notNull(),
	LastModified: timestamp('last_modified')
		.notNull()
		.$onUpdate(() => new Date()),
})
