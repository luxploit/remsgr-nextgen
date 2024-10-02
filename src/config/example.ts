import { Configuration } from './+config'

export const configuration: Configuration = {
	postgres: {
		host: 'localhost',
		port: 5432,
		username: '',
		password: '',
		database: 'remsgr',
	},
	server: {
		secret: 'defaultsecret_CHANGETHISASAP',
		environment: 'alpha',
		host: 'localhost:4200',
		http_port: 80,
		https_port: 443,
	},
	msn: {
		ip: '127.0.0.1',
		notification_port: 1863,
		switchboard_port: 1864,
	},
	ads: {
		enabled: true,
		ad_list: [
			{
				url: 'https://remsgr.net',
				image: 'xirk.png',
			},
			{
				url: 'https://remsgr.net',
				image: 'brat.png',
			},
		],
	},
}
