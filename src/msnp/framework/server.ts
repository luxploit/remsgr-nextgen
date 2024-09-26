import net from 'node:net'
import { logging } from '../../utils/logging'
import { getCommand, MSNPCommand } from './decoder'
import chalk from 'chalk'

export type PulseDataHandler = (socket: net.Socket, data: MSNPCommand[]) => void
export type PulseExitHandler = (socket: net.Socket) => void
export type PulseFailureHandler = (socket: net.Socket, err: Error) => void

export class PulseServer {
	private dataHandler?: PulseDataHandler
	private exitHandler?: PulseExitHandler
	private failureHandler?: PulseFailureHandler

	constructor() {}

	onData = (callback: PulseDataHandler) => (this.dataHandler = callback)
	onExit = (callback: PulseExitHandler) => (this.exitHandler = callback)
	onFailure = (callback: PulseFailureHandler) => (this.failureHandler = callback)

	build() {
		return net.createServer((socket) => {
			logging.info(`new connection: ${socket.remoteAddress}:${socket.remotePort}`)

			if (this.dataHandler) {
				socket.on('data', (data) => {
					logging.log(chalk.magenta, 'netDebug', 'incoming traffic', data.toString().trim())

					const result = getCommand(data)
					if (!result) {
						logging.warn('invalid command found, skipping!')
						return
					}

					this.dataHandler!(socket, result)
				})
			}

			if (this.exitHandler) {
				socket.on('close', () => this.exitHandler!(socket))
			}

			if (this.failureHandler) {
				socket.on('error', (err) => this.failureHandler!(socket, err))
			}
		})
	}
}
