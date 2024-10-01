import { logging } from '../../../utils/logging'
import { getCommand, PulseCommand } from '../../framework/decoder'
import { PulseInteractable } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import { handleINF, handleUSR, handleVER } from './session'
import net from 'node:net'

/**
 * TODO: Look into rewriting with class-based reflection (see AzureFlare for examples)
 *       v2 refactor mby? for now use "dumb" array list for handler registration
 */

const nsCommandHandlers = new Map<string, (user: PulseUser, cmd: PulseCommand) => Promise<void>>([
	['VER', handleVER],
	['INF', handleINF],
	['USR', handleUSR],
])

export const notificationServer = () => {
	return net.createServer(async (socket) => {
		logging.info(`New connection: ${socket.remoteAddress}:${socket.remotePort}`)

		const user = new PulseUser({
			notification: new PulseInteractable(socket),
			switchboard: new PulseInteractable(null),
			infoContext: {
				authenticationMethod: 'None',
				buildString: 'None',
				protocolVersion: 'None',
			},
		})

		socket.on('data', async (data) => {
			logging.debug('netDebug', 'Incoming traffic:', data.toString().trim())

			const result = getCommand(data)
			if (!result) {
				logging.error('Invalid command found! Closing')
				socket.destroy()
				return
			}

			for (let command of result) {
				const handler = nsCommandHandlers.get(command.Command)
				if (!handler) {
					logging.warn('No NS handler available for command', command.Command)
					return
				}

				user.nsDebug('Command handler', 'Processing NS command', command.Command)
				await handler(user, command)
			}
		})

		socket.on('close', () => {})

		socket.on('error', (err) => {})
	})
}
