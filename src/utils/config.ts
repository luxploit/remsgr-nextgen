import path from 'node:path'

import { Configuration } from '../config/+config'
import { program } from 'commander'

export interface CliArgs {
	dev?: boolean
	migrate?: boolean
}

const loadArgv = () => {
	program.option('-d, --dev', 'run in development mode')
	program.option('-m, --migrate', 'add pg schemas via drizzle')
	program.parse()

	return program.opts<CliArgs>()
}

const loadConfig = () => {
	const cfgPath = process.cwd() + '/src/config'
	const configFilePath = path.join(cfgPath, `config.${cliArgs.dev ? 'dev' : 'prod'}.ts`)

	const configTs = require(configFilePath).configuration
	return configTs as Configuration
}

export const cliArgs = loadArgv()
export const jsonConfig = loadConfig()
