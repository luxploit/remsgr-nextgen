import chalk from 'chalk'
import { Logger } from '../../utils/logging'
import { PulseClient } from './client'
import { cliArgs } from '../../utils/config'

export class PulseUser extends Logger {
	constructor(public client: PulseClient) {
		super()
	}

	private getHost = () => {
		return `[HOST ${this.client.notification.getHostAddress()}]`
	}

	info = (msg: string, ...optionals: any[]) => {
		super.info(this.getHost(), msg, ...optionals)
	}

	warn = (msg: string, ...optionals: any[]) => {
		super.warn(this.getHost(), msg, ...optionals)
	}

	error = (msg: string, ...optionals: any[]) => {
		super.error(this.getHost(), msg, ...optionals)
	}

	nsDebug = (handler: string, msg: string, ...optionals: any[]) => {
		if (!cliArgs.dev) return

		this.log(
			chalk.hex('#371F76') /* Meteorite Purple */,
			'nsDebug',
			this.getHost(),
			`[${handler}]`,
			msg,
			...optionals
		)
	}

	sbDebug = (handler: string, msg: string, ...optionals: any[]) => {
		if (!cliArgs.dev) return

		this.log(
			chalk.hex('#007fff') /* Azure Blue */,
			'sbDebug',
			this.getHost(),
			`[${handler}]`,
			msg,
			...optionals
		)
	}
}
