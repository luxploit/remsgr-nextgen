import { Socket } from 'node:net'
import { PulseCommand } from './decoder'
import { logging } from '../../utils/logging'

export class PulseInteractable {
	constructor(private readonly socket: Socket) {}

	quit = () => {
		this.socket.destroy()
	}

	send = (cmd: PulseCommand, args?: Array<string | number>) => {
		const output = [cmd.Command, cmd.TrId, ...(args ?? [])]
		logging.debug(
			'netDebug',
			`[HOST ${this.socket.remoteAddress!}]`,
			'Outgoing Traffic:',
			output.join(' ')
		)
		this.socket.write(`${output.join(' ')}\r\n`)
	}

	error = (cmd: PulseCommand, error: number) => {
		this.socket.write(`${error} ${cmd.TrId}\r\n`)
	}

	fatal = (cmd: PulseCommand, error: number) => {
		this.error(cmd, error)
		this.quit()
	}

	getHostAddress = () => this.socket.remoteAddress!
}
