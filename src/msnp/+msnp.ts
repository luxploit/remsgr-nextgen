import { logging } from '../utils/logging'
import { notificationServer } from './handlers/notification/+notification'
import { switchboardServer } from './handlers/switchboard/+switchboard'

export const msnpServer = async () => {
	notificationServer().listen(1863, () => logging.info('MSNP NS successfully initialized'))
	//switchboardServer().listen(1864, () => logging.info('MSNP SB successfully initialized'))
}
