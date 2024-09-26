import { Socket } from 'node:net'

export interface PulseClient {
	Session: PulseClientSession
	Context?: PulseClientInfoContext
}

export interface PulseClientSession {
	Notification: Socket | null
	Switchboard: Socket | null
}

export interface PulseClientInfoContext {
	AuthenticationMethod: 'CTP' | 'MD5' | 'TWN' | 'SSO'
	ProtocolVersion: number
	BuildString: string
}
