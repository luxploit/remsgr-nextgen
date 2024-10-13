import { logging } from '../../../utils/logging'
import { getCommand, PulseCommand } from '../../framework/decoder'
import { PulseInteractable } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import net from 'node:net'

const sbCommandHandlers = new Map<string, (user: PulseUser, cmd: PulseCommand) => void>([])

export const switchboardServer = () => {
	return net.createServer((socket) => {
		logging.info(`New connection: ${socket.remoteAddress}:${socket.remotePort}`)

		const user = new PulseUser()
		user.client.sb.push(new PulseInteractable(socket))

		socket.on('data', (data) => {
			logging.debug('netDebug', 'Incoming traffic:', data.toString().trim())

			const result = getCommand(data)
			if (!result) {
				logging.warn('Invalid command found, skipping!')
				return
			}

			for (let command of result) {
				const handler = sbCommandHandlers.get(command.Command)
				if (!handler) {
					logging.warn('No SB handler available for command', command.Command)
					return
				}

				user.sbDebug('Command handler', 'Processing SB command', command.Command)
				handler(user, command)
			}
		})

		socket.on('close', () => {})

		socket.on('error', (err) => {})
	})
}
