import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'
import { AuthMethodsT } from '../protocol/constants'

export class PulseClient {
	ns!: PulseInteractable
	sb!: PulseInteractable
}

export class PulseClientInfoContext {
	authenticationMethod!: AuthMethodsT
	protoName!: string
	protoDialect!: number
	buildString!: string
}
