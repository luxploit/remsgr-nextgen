import { PulseData } from '../../msnp/framework/user'
import { logging } from '../../utils/logging'
import { getAccountBySN, getAccountByUID } from './account'
import { getDetailsByUID } from './details'
import { getListByUID } from './lists'
import { getUserByUID } from './user'

export const populatePulseDataBySN = async (sn: string) => {
	let data = new PulseData()

	const account = await getAccountBySN(sn)
	if (!account) {
		logging.error('Failed to get Account by SN', sn)
		return null
	}
	data.account = account

	const user = await getUserByUID(account.UID)
	if (!user) {
		logging.error('Failed to get User by UID', account.UID)
		return null
	}
	data.user = user

	const details = await getDetailsByUID(account.UID)
	if (!details) {
		logging.error('Failed to get Details by UID', account.UID)
		return null
	}
	data.details = details

	const list = await getListByUID(account.UID)
	if (!list) {
		logging.error('Failed to get Lists by UID', account.UID)
		return null
	}
	data.list = list

	return data
}

export const populatePulseDataByUID = async (uid: number) => {
	let data = new PulseData()

	const account = await getAccountByUID(uid)
	if (!account) {
		logging.error('Failed to get Account by UID', uid)
		return null
	}
	data.account = account

	const user = await getUserByUID(account.UID)
	if (!user) {
		logging.error('Failed to get User by UID', account.UID)
		return null
	}
	data.user = user

	const details = await getDetailsByUID(account.UID)
	if (!details) {
		logging.error('Failed to get Details by UID', account.UID)
		return null
	}
	data.details = details

	const list = await getListByUID(account.UID)
	if (!list) {
		logging.error('Failed to get Lists by UID', account.UID)
		return null
	}
	data.list = list

	return data
}
