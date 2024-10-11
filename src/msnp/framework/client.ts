import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'
import { AuthMethodsT } from '../protocol/constants'

export class PulseClient {
	ns!: PulseInteractable
	sb!: PulseInteractable
}

export class PulseMachineContext {
	localeId!: number
	osType!: string
	osVersion!: string
	cpuArch!: string
}

export class PulseMessengerContext {
	authMethod!: AuthMethodsT
	dialect!: number
	version!: string
	intrLibName!: string
	intrCliName!: string
}

export class PulseStateContext {
	onlineStatus!: string
}

export class PulseContext {
	machine = new PulseMachineContext()
	messenger = new PulseMessengerContext()
	state = new PulseStateContext()
}
