import { pgEnum, pgTable, serial, timestamp, unique, varchar } from 'drizzle-orm/pg-core'
import { Accounts } from './account'

export const listEnum = pgEnum('list', ['FL', 'RL', 'AL', 'BL', 'PL'])

export const Lists = pgTable(
	'lists',
	{
		UID: serial('uid')
			.references(() => Accounts.UID)
			.notNull(),
		ContactID: serial('contact_id')
			.references(() => Accounts.UID)
			.notNull(),
		ListType: listEnum('list_type').notNull(),
		Reason: varchar('reason'),
		FriendedOn: timestamp('friended_on')
			.notNull()
			.$onUpdate(() => new Date()),
	},
	(table) => {
		return {
			friend_unique_idx: unique('friend_unique_idx').on(
				table.UID,
				table.ContactID,
				table.ListType
			),
		}
	}
)
