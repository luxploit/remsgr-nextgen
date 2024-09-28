import { logging } from '../../utils/logging'

const payloadCmds = new Set([
	'UUX',
	'MSG',
	'QRY',
	'NOT',
	'ADL',
	'FQY',
	'RML',
	'UUN',
	'UUM',
	'PUT',
	'DEL',
	'SDG',
	'VAS',
	'SDC',
])

export interface MSNPCommand {
	Command: string
	TrId: number
	Args: string[]
	Payload: Buffer
}

export const getCommand = (data: Buffer, prevResults?: MSNPCommand[]): MSNPCommand[] | null => {
	const endIndex = data.indexOf('\r\n')
	if (endIndex === -1) {
		logging.error('invalid buffer passed to msnp decoder! length was -1')
		return null
	}

	// CMD [trId] [...args] | cmd is always! present, trId always for incoming, args optional

	const cmd = data.subarray(0, endIndex).toString().trim()
	const splits = cmd.split(' ')
	if (splits.length <= 0) {
		logging.error('command call is of invalid length! was <= 0')
		return null
	}

	const command = splits[0]
	if (command.length !== 3) {
		logging.error('command is of invalid length! was not length === 3')
		return null
	}

	const trId = parseInt(splits[1], 10)
	if (trId < 0 || isNaN(trId)) {
		logging.error('trId is invalid! was < 0 or is NaN!')
		return null
	}

	// whitelisted payload command
	// Payloads always supply the last argument as the payload buffer len
	let payload = Buffer.alloc(0)
	if (payloadCmds.has(command)) {
		const payloadLength = parseInt(splits[splits.length - 1], 10)
		if (payloadLength < 0 || isNaN(payloadLength)) {
			logging.error('payloadLength is invalid! was < 0 or is NaN!')
			return null
		}

		payload = data.subarray(endIndex + 2 /* skip crlf */, payloadLength)
	}

	const args: string[] = []
	// Args present
	if (splits.length > 2) {
		for (const split in splits.slice(2)) {
			args.push(split)
		}
	}

	const result: MSNPCommand = { Command: command, TrId: trId, Args: args, Payload: payload }
	const prev = prevResults ? [...prevResults, result] : [result]
	if (payload.length === 0 && data.subarray(endIndex + 2).length > 0) {
		return getCommand(data.subarray(endIndex + 2), prev)
	}

	return prev
}
