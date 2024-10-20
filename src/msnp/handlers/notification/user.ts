import { GenericGroup } from '../../../database/models/user'
import {
	getListEntryByIDs,
	updateListEntryBitsByIDs,
	insertListEntry,
} from '../../../database/queries/lists'
import { updateUserClVersionByUID } from '../../../database/queries/user'
import { PulseCommand } from '../../framework/decoder'
import { PulseInteractableArgs } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import { ErrorCode } from '../../protocol/error_codes'
import { ListTypes, ListTypesT, ListBitFlags } from '../../protocol/sync'
import {
	buildLegacyGroupIDsMap,
	createFakeContactUserBySN,
	getListBitByListType,
	getSNfromMail,
	makeEmailFromSN,
} from '../../util'
import { handleCHG_Async } from './presence'

/*
 * MSNP2 - MSNP6:
 *   -> ADD [trId] [listType] [passport] [displayName or passport]
 *   <- ADD [trId] [listType] [serverSyncId + 1] [passport] [displayName or passport]
 *
 * MSNP7 - MSNP9:
 *   -> ADD [trId] [listType] [passport] [displayName or passport] [groupIdx[,]]
 *   <- ADD [trId] [listType] [serverSyncId + 1] [passport] [displayName or passport] [groupIdx[,]]
 *
 * MSNP10+:
 *   - Command is Disabled -
 */
export const handleADD = async (user: PulseUser, cmd: PulseCommand) => {
	const oppositeList = (cid: number, listBit: number) => {
		const list = user.data.list.filter((li) => li.ListBits === listBit)
		const isPresent = list.find((li) => li.ContactID === cid)

		return isPresent
	}

	if (user.context.messenger.dialect >= 10) {
		user.warn(
			`Client tried to call ADD using an unsupported dialect MSNP${user.context.messenger.dialect}`
		)
		return user.client.ns.error(cmd, ErrorCode.DisabledCommand)
	}

	if (cmd.TrId === -1) {
		user.error('Client did not provide a valid Transaction ID to command ADD')
		return user.client.ns.quit()
	}

	if (cmd.Args.length < 3 || cmd.Args.length > 4) {
		user.error(`Client provided an invalid amount of arguments to command ADD`)
		return user.client.ns.error(cmd, ErrorCode.InvalidParameter)
	}

	if (!Object.values(ListTypes).includes(cmd.Args[0] as ListTypes)) {
		user.error('Client tried to use an invalid online status!')
		return user.client.ns.error(cmd, ErrorCode.BadUserListFormat)
	}

	const listType = cmd.Args[0] as ListTypesT
	if (listType === ListTypes.Reverse) {
		user.error('Client attempted to add to the RL! Disconnecting...')
		return user.client.ns.quit()
	}

	const passport = cmd.Args[1]

	const contact = await createFakeContactUserBySN(user, getSNfromMail(passport))
	if (!contact) {
		const errCode =
			user.context.messenger.dialect >= 10 ? ErrorCode.InvalidUser : ErrorCode.LegacyInvalidUser

		user.error('Client specified an invalid passport user!', passport)
		return user.client.ns.error(cmd, errCode)
	}

	// TODO: revisit this for dynamic limits
	const listBit = getListBitByListType(listType)
	const wantedList = user.data.list.filter((li) => li.ListBits & listBit)
	if (wantedList.length >= 600) {
		user.warn('Client has reached the maximum amount of contacts for listtype', listType)
		return user.client.ns.error(cmd, ErrorCode.ListLimitReached)
	}

	// check for duplicate
	const isPresent = wantedList.find((li) => li.ContactID === contact.data.account.UID)
	if (isPresent) {
		user.error(
			`Client attempted to add a duplicate contact entry ${passport} to listtype ${listType}`
		)
		return user.client.ns.error(cmd, ErrorCode.UserAlreadyOnList)
	}

	// check for AL/BL opposites
	{
		const alPresent = oppositeList(ListBitFlags.Allow, contact.data.account.UID)
		const blPresent = oppositeList(ListBitFlags.Block, contact.data.account.UID)

		if ((listType === ListTypes.Allow && blPresent) || (listType === ListTypes.Block && alPresent)) {
			user.error(
				`Client attempted to add a contact entry ${passport} to opposite list ${listType}!`
			)
			return user.client.ns.error(cmd, ErrorCode.UserOnOppositeList)
		}
	}

	// process group guids to Idxs
	const groups: number[] = []
	if (user.context.messenger.dialect >= 7) {
		const groupArg = cmd.Args[3]
		const isArray = groupArg.indexOf(',') !== -1

		if (isArray) {
			const grouparr = groupArg.split(',')
			for (const arr of grouparr) {
				const idx = parseInt(arr)
				if (isNaN(idx)) {
					user.error('Client specified an invalid group idx to command ADD!')
					return user.client.ns.error(cmd, ErrorCode.InvalidContactGroup)
				}

				groups.push(idx)
			}
		} else {
			const idx = parseInt(groupArg)
			if (isNaN(idx)) {
				user.error('Client specified an invalid group idx to command ADD!')
				return user.client.ns.error(cmd, ErrorCode.InvalidContactGroup)
			}

			groups.push(idx)
		}

		const mapping = new Map<number, string>()
		if (user.data.user.ContactGroups) {
			let idx = 0
			for (const dbGroup of user.data.user.ContactGroups) {
				mapping.set(++idx, dbGroup.guid)
			}
		}

		for (const group of groups) {
			if (!group) {
				continue
			}

			if (!mapping.has(group)) {
				user.error('Client specified an unknown group idx to command ADD!')
				return user.client.ns.error(cmd, ErrorCode.InvalidContactGroup)
			}
		}
	}

	// handle contact's entry (cl)
	const clEntry = await getListEntryByIDs(contact.data.account.UID, user.data.account.UID)
	if (clEntry) {
		const listBits = clEntry.ListBits | ListBitFlags.Reverse
		await updateListEntryBitsByIDs(contact.data.account.UID, user.data.account.UID, listBits)
	} else {
		await insertListEntry({
			UID: contact.data.account.UID,
			ContactID: user.data.account.UID,
			ListBits: ListBitFlags.Reverse,
			Groups: null,
			Reason: null,
			FriendedOn: new Date(),
		})
	}

	// handle our/users's entry (ul)
	const ulEntry = await getListEntryByIDs(user.data.account.UID, contact.data.account.UID)
	if (ulEntry) {
		const listBits = ulEntry.ListBits | listBit
		await updateListEntryBitsByIDs(user.data.account.UID, contact.data.account.UID, listBits)
	} else {
		await insertListEntry({
			UID: user.data.account.UID,
			ContactID: contact.data.account.UID,
			ListBits: listBit,
			Groups: null,
			Reason: null,
			FriendedOn: new Date(),
		})
	}

	// update syncId
	{
		user.data.user.ClVersion = user.data.user.ClVersion + 1
		await updateUserClVersionByUID(user.data.account.UID, user.data.user.ClVersion)

		contact.data.user.ClVersion = contact.data.user.ClVersion + 1
		await updateUserClVersionByUID(contact.data.account.UID, contact.data.user.ClVersion)
	}

	// base args: MSNP2 - MSNP6
	const args: PulseInteractableArgs = [
		listType,
		user.data.user.ClVersion,
		makeEmailFromSN(contact.data.account.ScreenName, user.context.messenger.dialect === 2),
		contact.data.user.DisplayName,
	]

	// MSNP7 - MSNP9
	if (user.context.messenger.dialect >= 7) {
		args.push(groups.join(','))
	}

	await handleCHG_Async(user)

	return user.client.ns.reply(cmd, args)
}
