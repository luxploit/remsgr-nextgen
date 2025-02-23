import net from 'node:net'
import { logging } from '../../../utils/logging'
import { getCommand, PulseCommand } from '../../framework/decoder'
import { PulseInteractable } from '../../framework/interactable'
import { PulseUser } from '../../framework/user'
import { handleINF, handleOUT, handleUSR, handleVER } from './logon'
import { handleBLP, handleGTC, handleSYN } from './synchronization'
import { DispatchCmds, MiscCmds, PresenceCmds, SyncCmds, UserCmds } from '../../protocol/commands'
import { handleCHG, handleCVQ, handleCVR, handleUUX, handleREA } from './presence'
import { handleGCF, handleURL } from './misc'
import { handleADD } from './user'

/**
 * TODO: Look into rewriting with class-based reflection (see AzureFlare for examples)
 *       v2 refactor mby? for now use "dumb" array list for handler registration
 */

const nsCommandHandlers = new Map<string, (user: PulseUser, cmd: PulseCommand) => Promise<void>>([
	// Dispatch
	[DispatchCmds.ProtocolVersion, handleVER],
	[DispatchCmds.GetAuthProviderLegacy, handleINF],
	[DispatchCmds.Authenticate, handleUSR],
	[DispatchCmds.SignOut, handleOUT],

	// Synchronization
	[SyncCmds.BeginSynchronizationLegacy, handleSYN],
	[SyncCmds.ListChangeNotifications, handleGTC],
	[SyncCmds.AvailablityPrivacy, handleBLP],

	// Presence
	[PresenceCmds.ClientVersionRecord, handleCVR],
	[PresenceCmds.ClientVersionQuery, handleCVQ],
	[PresenceCmds.ChangeStatus, handleCHG],
	[PresenceCmds.SetExtendedStatus, handleUUX],
	[PresenceCmds.RenameFriendlyLegacy, handleREA],

	// Miscellaneous
	[MiscCmds.PolicyConfiguration, handleGCF],
	[MiscCmds.ServiceLinks, handleURL],

	// User
	[UserCmds.AddToListLegacy, handleADD],
])

export const notificationServer = () => {
	return net.createServer(async (socket) => {
		logging.info(`New connection: ${socket.remoteAddress}:${socket.remotePort}`)

		const user = new PulseUser()
		user.client.ns = new PulseInteractable(socket)

		socket.on('data', async (data) => {
			user.debug('netDebug', 'Incoming traffic:', data.toString().trim())

			const result = getCommand(data)
			if (!result) {
				logging.error('Invalid command found! Closing...')
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
