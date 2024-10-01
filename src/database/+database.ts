import mongoose from 'mongoose'
import { jsonConfig } from '../utils/config'
import { logging } from '../utils/logging'

export const initDatabase = async () => {
	await mongoose.connect(jsonConfig.mongodb.uri, {
		user: jsonConfig.mongodb.username,
		pass: jsonConfig.mongodb.password,
	})

	const buildInfo = await mongoose.connection.db?.admin().buildInfo()
	logging.info(
		`Connected to MoronDB! Version: ${buildInfo!['version']} with Mongoose ${mongoose.version} `
	)
}
