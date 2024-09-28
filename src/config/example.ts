import { Configuration } from './+config'

const configuration: Configuration = {
	server: {
		secret: '',
		environment: '',
		host: '',
		ip: '',
		notification_port: 0,
		switchboard_port: 0,
		http_port: 0,
		https_port: 0,
	},
	msn: {},
	ads: {
		enabled: false,
		ad_list: [],
	},
}
