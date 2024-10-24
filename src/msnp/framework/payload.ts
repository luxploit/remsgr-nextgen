export enum PayloadTypes {
	PlainText = 'text/plain',
	SystemMessage = 'text/x-msmsgssystemmessage',
	ProfileMessage = 'text/x-msmsgsprofile',
	NewMailNotification = 'text/x-msmsgsemailnotification',
	InitialMailNotification = 'text/x-msmsgsinitialemailnotification',
	ActiveMailNotification = 'text/x-msmsgsactivemailnotification',
	InitialMData = 'text/x-msmsgsinitialmdatanotification',
	MessageControls = 'text/x-msmsgscontrol',
	ClientCapabilities = 'text/x-clientcaps',
	AimWarning = 'text/x-aimwarning',
}

export class PulsePayloadBuilder {
	private parts = ''
	private headers = ''

	constructor(private readonly contentType: string) {}

	addPart = (part: string) => {
		this.parts += `${part}\r\n`
		return this
	}

	addNewline = () => {
		this.parts += '\r\n'
		return this
	}

	addHeader = (header: string) => {
		this.headers += `${header}\r\n`
		return this
	}

	build = () =>
		`MIME-Version: 1.0\r\nContent-Type: ${this.contentType}\r\n${this.headers}\r\n${this.parts}`
}

export const payload = (type: PayloadTypes) => new PulsePayloadBuilder(type as string)
