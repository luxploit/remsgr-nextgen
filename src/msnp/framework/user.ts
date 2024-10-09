import chalk from 'chalk'
import { Logger } from '../../utils/logging'
import { PulseClient, PulseClientInfoContext } from './client'
import { cliArgs } from '../../utils/config'
import { AccountsT } from '../../database/models/account'
import { UsersT } from '../../database/models/user'
import { DetailsT } from '../../database/models/detail'
import { ListsT } from '../../database/models/list'

export class PulseUser extends Logger {
	client = new PulseClient()
	data = new PulseData()
	context = new PulseClientInfoContext()

	constructor() {
		super()
	}

	private getHost = () => {
		return `[HOST ${this.client.ns.getHostAddress()}]`
	}

	info = (msg: string, ...optionals: any[]) => {
		return super.info(this.getHost(), msg, ...optionals)
	}

	warn = (msg: string, ...optionals: any[]) => {
		return super.warn(this.getHost(), msg, ...optionals)
	}

	error = (msg: string, ...optionals: any[]) => {
		return super.error(this.getHost(), msg, ...optionals)
	}

	debug = (handler: string, msg: string, ...optionals: any[]) => {
		return super.debug(handler, this.getHost(), msg, ...optionals)
	}

	nsDebug = (handler: string, msg: string, ...optionals: any[]) => {
		if (!cliArgs.dev) return

		return this.log(
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

		return this.log(
			chalk.hex('#007fff') /* Azure Blue */,
			'sbDebug',
			this.getHost(),
			`[${handler}]`,
			msg,
			...optionals
		)
	}
}

export class PulseData {
	account!: AccountsT
	user!: UsersT
	details!: DetailsT
	list!: ListsT[]
}
