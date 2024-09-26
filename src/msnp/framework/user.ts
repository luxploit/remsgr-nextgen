import chalk from 'chalk'
import { Logger } from '../../utils/logging'
import { PulseClient } from './client'

export class PulseUser extends Logger {
	constructor(private client: PulseClient) {
		super()
	}

	info(msg: string, ...optionals: any[]) {
		super.info(`[HOST: ${this.client.Session.Notification?.remoteAddress}]`, msg, optionals)
	}

	warn(msg: string, ...optionals: any[]) {
		super.warn(`[HOST: ${this.client.Session.Notification?.remoteAddress}]`, msg, optionals)
	}

	error(msg: string, ...optionals: any[]) {
		super.error(`[HOST: ${this.client.Session.Notification?.remoteAddress}]`, msg, optionals)
	}

	nsDebug(handler: string, msg: string, ...optionals: any[]) {
		this.log(
			chalk.hex('#371F76') /* Meteorite Purple */,
			'nsDebug',
			`[HOST: ${this.client.Session.Notification?.remoteAddress}]`,
			`[${handler}]`,
			msg,
			optionals
		)
	}

	sbDebug(handler: string, msg: string, ...optionals: any[]) {
		this.log(
			chalk.hex('#007fff') /* Azure Blue */,
			'sbDebug',
			`[HOST: ${this.client.Session.Notification?.remoteAddress}]`,
			`[${handler}]`,
			msg,
			optionals
		)
	}
}
