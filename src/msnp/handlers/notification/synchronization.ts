import { PulseCommand } from '../../framework/decoder'
import { PulseUser } from '../../framework/user'
import { Commands, Errors } from '../../protocol/constants'
import { getClVersions, getProtoNumber } from '../../util'

const syncCmds = Commands.Synchronization

export const handleSYN = async (user: PulseUser, cmd: PulseCommand) => {
	if (cmd.Args.length <= 0 || cmd.Args.length >= 3) {
		return user.client.switchboard.fatal(cmd, Errors.ServerIsBusy)
	}

	if (getProtoNumber(user) <= 9) {
		user.info('Starting legacy synchornization process...')
		return await handleSYN_Legacy(user, cmd)
	} else {
		user.error(
			'Client tried to call SYN with unsupported protocol version:',
			user.client.infoContext.protocolVersion
		)
		return user.client.notification.quit()
	}
}

const handleSYN_Legacy = async (user: PulseUser, cmd: PulseCommand) => {
	const cl = getClVersions(user, cmd)

	user.client.notification.send(cmd, [cl.server])
	if (cl.client === cl.server) {
		return user.info('Finished synchronization early (nothing to re-sync)!')
	}

	user.info("Syncing privacy settings...")
	{
		// TODO: Respect privacy settings!
		user.client.notification.sendRaw(syncCmds.FriendRequestPrivacy, cmd.TrId, [cl.server, 'A'])
		user.client.notification.sendRaw(syncCmds.InstantMessagesPrivacy, cmd.TrId, [cl.server, 'AL'])
	}

	if (getProtoNumber(user) >= 7) {
		user.info('Starting group synchronization...')


	}

	user.info('Finished synchronization!')
}
