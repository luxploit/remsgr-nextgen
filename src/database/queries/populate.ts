import { PulseData } from '../../msnp/framework/user'
import { getAccountBySN } from './account'
import { getDetailsByUID } from './details'
import { getListsByUID } from './lists'
import { getUserByUID } from './user'

export const populatePulseDataBySN = async (sn: string) => {
	let data = new PulseData()

	const account = await getAccountBySN(sn)
	if (!account) {
		return null
	}
	data.account = account

	const user = await getUserByUID(account.UID)
	if (!user) {
		return null
	}
	data.user = user

	const details = await getDetailsByUID(account.UID)
	if (!details) {
		return null
	}
	data.details = details

	const list = await getListsByUID(account.UID)
	if (!list) {
		return null
	}
	data.list = list

	return data
}
