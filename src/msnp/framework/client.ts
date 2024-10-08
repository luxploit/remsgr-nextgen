import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'
import { AuthMethodsT } from '../protocol/constants'

export class PulseClient {
	notification!: PulseInteractable
	switchboard!: PulseInteractable
	infoContext!: PulseClientInfoContext
}

export class PulseClientInfoContext {
	authenticationMethod!: AuthMethodsT
	protocolVersion!: string
	buildString!: string
}
