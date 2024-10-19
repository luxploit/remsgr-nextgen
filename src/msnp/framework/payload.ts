export enum PayloadTypes {
	PlainText = 'text/plain',
	SystemMessage = 'application/x-msmsgssystemmessage',
	ProfileMessage = 'text/x-msmsgsprofile',
	NewMailNotification = 'text/x-msmsgsemailnotification',
	InitialMailNotification = 'text/x-msmsgsinitialemailnotification',
	ActiveMailNotification = 'text/x-msmsgsactivemailnotification',
	InitialMData = 'text/x-msmsgsinitialmdatanotification',
	MessageControls = 'text/x-msmsgscontrol',
	ClientCapabilities = 'text/x-clientcaps',
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

	build = () => {
		return `MIME-Version: 1.0\r\nContent-Type: ${this.contentType}\r\n${this.headers}\r\n${this.parts}`
	}
}

export const payload = (type: PayloadTypes, charset?: string) => {
	const part = (type as string) + charset ? '; charset=UTF8' : ''
	return new PulsePayloadBuilder(part)
}
