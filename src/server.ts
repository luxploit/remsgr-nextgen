// Codename: LivePulse; ReMessenger TypeScript recode

import chalk from 'chalk'
import { msnpServer } from './msnp/+msnp'
import { webServer } from './www/+www'
import { versionInfo } from './utils/versions'
import { initDatabase } from './database/+database'
import { logging } from './utils/logging'

const main = async () => {
	console.log(chalk.magenta(`remsgr/livepulse | ${versionInfo()}`))
	await initDatabase()

	webServer()
	msnpServer()
}

process.on('uncaughtException', (err) => {
	logging.error('Exception occured!', err.name, err.message, err.cause, err.stack)
})

process.on('unhandledRejection', (reason, _) => {
	logging.error('Promise rejected!', reason)
})

main()
