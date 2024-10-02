export interface Configuration {
	postgres: {
		host: string
		port: number
		database: string
		username: string
		password: string
	}
	server: {
		secret: string
		environment: string
		host: string
		http_port: number
		https_port: number
	}
	msn: {
		ip: string
		notification_port: number
		switchboard_port: number
	}
	ads: {
		enabled: boolean
		ad_list: {
			url: string
			image: string
		}[]
	}
}
