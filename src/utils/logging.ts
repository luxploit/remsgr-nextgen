import chalk, { ChalkInstance } from 'chalk'

export class Logger {
	log(color: ChalkInstance, prefix: string, msg: string, ...optionals: any[]) {
		return console.log(
			color(`[${new Date().toLocaleTimeString()}]`, `[${prefix}]`, msg, ...optionals)
		)
	}

	info(msg: string, ...optionals: any[]) {
		return this.log(chalk.green, 'info', msg, ...optionals)
	}

	warn(msg: string, ...optionals: any[]) {
		return this.log(chalk.yellow, 'warn', msg, ...optionals)
	}

	error(msg: string, ...optionals: any[]) {
		return this.log(chalk.red, 'error', msg, ...optionals)
	}

	debug(handler: string, msg: string, ...optionals: any[]) {
		return this.log(chalk.magenta, handler, msg, ...optionals)
	}
}

export const logging = new Logger()
