import { Configuration } from './+config'

export const configuration: Configuration = {
	server: {
		secret: 'defaultsecret_CHANGETHISASAP',
		environment: 'alpha',
		host: 'localhost:4200',
		ip: '127.0.0.1',
		notification_port: 1863,
		switchboard_port: 1864,
		http_port: 80,
		https_port: 443,
	},
	msn: {},
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
