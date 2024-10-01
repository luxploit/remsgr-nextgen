// Codename: LivePulse; ReMessenger TypeScript recode

import chalk from 'chalk'
import { msnpServer } from './msnp/+msnp'
import { webServer } from './www/+www'
import { versionInfo } from './utils/versions'
import { initDatabase } from './database/+database'

const main = async () => {
	console.log(chalk.magenta(`remsgr/livepulse | ${versionInfo()}`))
	await initDatabase()

	webServer()
	msnpServer()
}

main()
