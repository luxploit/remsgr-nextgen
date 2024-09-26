import chalk, { Chalk } from 'chalk'

export class Logger {
	log(color: Chalk, prefix: string, msg: string, ...optionals: any[]) {
		console.log(color(`[${new Date().toLocaleTimeString()}]`, `[${prefix}]`, msg, optionals))
	}

	info(msg: string, ...optionals: any[]) {
		this.log(chalk.green, 'info', msg, optionals)
	}

	warn(msg: string, ...optionals: any[]) {
		this.log(chalk.yellow, 'warn', msg, optionals)
	}

	error(msg: string, ...optionals: any[]) {
		this.log(chalk.red, 'error', msg, optionals)
	}
}

export const logging = new Logger()
