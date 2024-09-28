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
