import { logging } from '../utils/logging'
import { PulseUser } from './framework/user'
import { notificationServer } from './handlers/notification/+notification'
import { switchboardServer } from './handlers/switchboard/+switchboard'
import { registerHbsPartials } from './util'

export const activeUsers: Record<number, PulseUser> = []

export const msnpServer = async () => {
	await registerHbsPartials()

	notificationServer().listen(1863, () => logging.info('MSNP NS successfully initialized'))
	//switchboardServer().listen(1864, () => logging.info('MSNP SB successfully initialized'))
}

// TODO - Fix/Impl the following things: Privacy Flags; Kids Passport; Passport Verification
