import { Socket } from 'node:net'
import { PulseCommand } from './decoder'
import { logging } from '../../utils/logging'

export type PulseInteractableArgs = Array<string | number | boolean>

export class PulseInteractable {
	constructor(private readonly socket: Socket) {}

	quit = () => {
		this.socket.destroy()
	}

	private socketWrite = (output: PulseInteractableArgs) => {
		logging.debug(
			'netDebug',
			`[HOST ${this.socket.remoteAddress!}]`,
			'Outgoing Traffic:',
			output.join(' ')
		)
		this.socket.write(`${output.join(' ')}\r\n`)
	}

	reply = (cmd: PulseCommand, args?: PulseInteractableArgs) =>
		this.socketWrite([cmd.Command, cmd.TrId, ...(args ?? [])])

	send = (command: string, trId: number, args?: PulseInteractableArgs) =>
		this.socketWrite([command, trId, ...(args ?? [])])

	untracked = (command: string, args?: PulseInteractableArgs) =>
		this.socketWrite([command, ...(args ?? [])])

	payload = (command: string, trId: number, args?: PulseInteractableArgs, payload?: string) =>
		this.socketWrite([command, trId, ...(args ?? []), ...(payload ? ['\r\n', payload] : [])])

	echo = (cmd: PulseCommand) => this.socketWrite([cmd.Command, cmd.TrId, ...cmd.Args])

	error = (cmd: PulseCommand, error: number) => this.socketWrite([error, cmd.TrId])

	fatal = (cmd: PulseCommand, error: number) => {
		this.error(cmd, error)
		return this.quit()
	}

	getHostAddress = () => this.socket.remoteAddress!
}
