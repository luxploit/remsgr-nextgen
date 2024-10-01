import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'

export type PulseAuthenticationMethods = 'CTP' | 'MD5' | 'SHA' | 'TWN' | 'SSO' | 'None'

export interface PulseClient {
	notification: PulseInteractable
	switchboard: PulseInteractable
	infoContext: PulseClientInfoContext
}

export interface PulseClientInfoContext {
	authenticationMethod: PulseAuthenticationMethods
	protocolVersion: string
	buildString: string
}
