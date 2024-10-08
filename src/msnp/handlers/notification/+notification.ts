import { logging } from '../../../utils/logging'
import { PulseClient } from '../../framework/client'
import { getCommand, PulseCommand } from '../../framework/decoder'
import { PulseInteractable } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import { handleINF, handleUSR, handleVER } from './logon'
import net from 'node:net'
import { handleSYN } from './synchronization'

/**
 * TODO: Look into rewriting with class-based reflection (see AzureFlare for examples)
 *       v2 refactor mby? for now use "dumb" array list for handler registration
 */

const nsCommandHandlers = new Map<string, (user: PulseUser, cmd: PulseCommand) => Promise<void>>([
	['VER', handleVER],
	['INF', handleINF],
	['USR', handleUSR],
	['SYN', handleSYN],
])

export const notificationServer = () => {
	return net.createServer(async (socket) => {
		logging.info(`New connection: ${socket.remoteAddress}:${socket.remotePort}`)

		const user = new PulseUser()
		user.client.notification = new PulseInteractable(socket)

		socket.on('data', async (data) => {
			user.debug('netDebug', 'Incoming traffic:', data.toString().trim())

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

		socket.on('close', () => {
			user.info('Client has closed the connection!')
		})

		socket.on('error', (err) => {
			user.error('Client socket closed with error:', err)
		})
	})
}
