// Codename: LivePulse; ReMessenger TypeScript recode

import chalk from 'chalk'
import { msnpServer } from './msnp/+msnp'
import { webServer } from './www/+www'
import { config } from 'dotenv'
import { versionInfo } from './utils/versions'

const main = () => {
	console.log(chalk.magenta(`remsgr/livepulse | ${versionInfo()}`))

	webServer()
	msnpServer()
}

config() && main()
