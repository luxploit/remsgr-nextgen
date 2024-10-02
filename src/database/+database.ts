import mongoose from 'mongoose'
import { cliArgs, jsonConfig } from '../utils/config'
import { logging } from '../utils/logging'
import postgres from 'postgres'
import { drizzle, PostgresJsDatabase } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import { DefaultLogger, sql } from 'drizzle-orm'
import { customDrizzleLog } from './logging'
import { exit } from 'node:process'

let db: PostgresJsDatabase
let pg: postgres.Sql<{}>
export const getDB = () => {
	return { db, pg }
}

export const initDatabase = async () => {
	// await mongoose.connect(jsonConfig.mongodb.uri, {
	// 	user: jsonConfig.mongodb.username,
	// 	pass: jsonConfig.mongodb.password,
	// })

	// const buildInfo = await mongoose.connection.db?.admin().buildInfo()
	// logging.info(
	// 	`Connected to MoronDB! Version: ${buildInfo!['version']} with Mongoose ${mongoose.version} `
	// )

	const p = jsonConfig.postgres
	pg = postgres(`postgres://${p.username}:${p.password}@${p.host}:${p.port}/${p.database}`)
	db = drizzle(pg, { logger: new DefaultLogger({ writer: new customDrizzleLog() }) })

	const version = await db.execute(sql`select version()`)
	logging.info(`Connected to ${version.at(0)!['version']}`)

	if (cliArgs.migrate) {
		logging.info('Running migrations...')
		await migrate(db, { migrationsFolder: './src/database/migrations' })
		await pg.end()
		exit(0)
	}
}
