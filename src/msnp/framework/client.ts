import { Socket } from 'node:net'
import { PulseInteractable } from './interactable'
import { AuthMethodsT } from '../protocol/constants'
import { OnlineStatusT } from '../protocol/presence'

export class PulseClient {
	ns!: PulseInteractable
	sb: PulseInteractable[] = []
}

export class PulseMachineContext {
	localeId!: number
	osType!: string
	osVersion!: string
	cpuArch!: string
	mGUID!: string
}

export class PulseMessengerContext {
	authMethod!: AuthMethodsT
	dialect!: number
	version!: string
	intrLibName!: string
	intrCliName!: string
}

export class PulseStateContext {
	initialStatus: boolean = false
	onlineStatus!: OnlineStatusT
	clientCaps!: string // todo
	pfpObject!: string // todo
	ubxStatus!: Buffer
	signedIn: boolean = false
}

export class PulseContext {
	machine = new PulseMachineContext()
	messenger = new PulseMessengerContext()
	state = new PulseStateContext()
}
