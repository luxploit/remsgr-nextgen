import { Socket } from 'node:net'
import { logging } from '../../../utils/logging'
import { MSNPCommand } from '../../framework/decoder'
import { PulseServer } from '../../framework/server'
import { PulseUser } from '../../framework/user'

const nsCommandHandlers = new Map<string, (user: PulseUser, data: MSNPCommand) => void>([])

export const notificationServer = () => {
	const server = new PulseServer()

	server.onData((socket, data) => {
		for (let command of data) {
			const handler = nsCommandHandlers.get(command.Command)
			if (!handler) {
				logging.warn(`no handler available for command`, command.Command)
				return
			}

			const user = new PulseUser({
				Session: {
					Notification: socket,
					Switchboard: null,
				},
			})

			user.nsDebug('command handler', 'processing command', command.Command)

			handler(user, command)
		}
	})

	server.onExit((socket) => {})

	server.onFailure((socket, err) => {})

	server.build().listen(1863, () => logging.info('msnp ns server successfully initialized'))
}
