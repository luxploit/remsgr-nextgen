import { Logger, LogWriter } from 'drizzle-orm'
import { logging } from '../utils/logging'
import chalk from 'chalk'

export class customDrizzleLog implements LogWriter {
	write(message: string) {
		logging.log(chalk.ansi256(73), 'pgDebug', message)
	}
}
