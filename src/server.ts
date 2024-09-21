/* Refactor v1 - TypeScript */

import chalk from 'chalk'
import { msnpServer } from './msnp/+msnp'
import { webServer } from './www/+www'
import { getGitinfo, parseGitInfo } from './utils/git'
import { config } from 'dotenv'

const main = () => {
	config()

	const gitInfo = parseGitInfo(getGitinfo())

	console.log(chalk.magenta(`remsgr server | ${gitInfo}`))

	webServer()
	msnpServer()
}

main()
