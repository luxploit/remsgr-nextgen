import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'
import { AuthMethodsT } from '../protocol/constants'

export class PulseClient {
	ns!: PulseInteractable
	sb!: PulseInteractable
}

export class PulseClientMachineContext {
	localeId!: number
	osType!: string
	osVersion!: string
	cpuArch!: string
}

export class PulseClientMessengerContext {
	authMethod!: AuthMethodsT
	dialect!: number
	version!: string
	intrLibName!: string
	intrCliName!: string
}

export class PulseClientInfoContext {
	machine = new PulseClientMachineContext()
	messenger = new PulseClientMessengerContext()
}
