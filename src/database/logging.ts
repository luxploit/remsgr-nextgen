import { Logger, LogWriter } from 'drizzle-orm'
import { logging } from '../utils/logging'
import chalk from 'chalk'
import { cliArgs } from '../utils/config'

export class customDrizzleLog implements LogWriter {
	write(message: string) {
		if (!cliArgs.dev) return

		logging.log(chalk.ansi256(73), 'pgDebug', message)
	}
}
