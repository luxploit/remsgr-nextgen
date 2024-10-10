import { integer, pgTable, serial, timestamp, unique, uuid, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'

export const Lists = pgTable(
	'lists',
	{
		UID: serial('uid')
			.references(() => Accounts.UID)
			.notNull(),
		ContactID: serial('contact_id')
			.references(() => Accounts.UID)
			.notNull(),
		ListBits: integer('list_bits').notNull().default(0),
		Groups: uuid('groups').array(),
		Reason: varchar('reason'),
		FriendedOn: timestamp('friended_on')
			.defaultNow()
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => {
		return {
			friend_unique_idx: unique('friend_unique_idx').on(table.UID, table.ContactID),
		}
	}
)

export type ListsT = typeof Lists.$inferSelect
