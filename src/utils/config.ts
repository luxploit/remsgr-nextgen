import path from 'node:path'
import fs from 'node:fs'

export const isDebug = process.env['DEBUG'] === 'true'
export const webPath = isDebug ? './src/www' : './server'

export interface Configuration {
	server: {
		secret: string
		environment: string
		host: string
		ip: string
		notification_port: number
		switchboard_port: number
		http_port: number
		https_port: number
	}
	msn: {}
	ads: {
		enabled: boolean
		ad_list: {
			url: string
			image: string
		}[]
	}
}

const loadConfig = () => {
	const cfgPath = isDebug ? './' : './server'
	const configFilePath = path.join(cfgPath, 'config.json')

	const configFile = fs.readFileSync(configFilePath, 'utf-8')
	const config = JSON.parse(configFile)
	return config as Configuration
}
export const jsonConfig = loadConfig()
