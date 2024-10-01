import { Socket } from 'node:net'
import { PulseCommand } from './decoder'
import { logging } from '../../utils/logging'

export class PulseInteractable {
	constructor(private readonly socket: Socket | null) {}

	quit = () => {
		if (!this.socket) return

		this.socket.destroy()
	}

	send = (cmd: PulseCommand, args?: Array<string | number>) => {
		if (!this.socket) return

		const output = [cmd.Command, cmd.TrId, ...(args ?? [])]
		logging.debug('netDebug', 'Outgoing Traffic:', output.join(' '))
		this.socket.write(`${output.join(' ')}\r\n`)
	}

	error = (cmd: PulseCommand, error: number) => {
		if (!this.socket) return

		this.socket.write(`${error} ${cmd.TrId}\r\n`)
	}

	fatal = (cmd: PulseCommand, error: number) => {
		this.error(cmd, error)
		this.quit()
	}

	getHostAddress = () => (this.socket ? this.socket.remoteAddress! : '!Invalid!')
}
