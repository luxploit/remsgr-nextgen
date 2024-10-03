import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'

export type PulseAuthenticationMethods = 'CTP' | 'MD5' | 'SHA' | 'TWN' | 'SSO' | 'None'

export class PulseClient {
	notification!: PulseInteractable
	switchboard!: PulseInteractable
	infoContext!: PulseClientInfoContext
}

export class PulseClientInfoContext {
	authenticationMethod!: PulseAuthenticationMethods
	protocolVersion!: string
	buildString!: string
}
