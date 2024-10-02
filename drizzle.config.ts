import { defineConfig } from 'drizzle-kit'
import path from 'node:path'

const loadConfig = () => {
	const cfgPath = process.cwd() + '/src/config'
	const configFilePath = path.join(cfgPath, `config.dev.ts`)

	const configTs = require(configFilePath).configuration
	return configTs
}

const config = loadConfig()

export default defineConfig({
	schema: './src/database/models/*',
	out: './src/database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		host: config.postgres.host,
		port: config.postgres.port,
		user: config.postgres.username,
		password: config.postgres.password,
		database: config.postgres.database,
	},
	verbose: true,
})
