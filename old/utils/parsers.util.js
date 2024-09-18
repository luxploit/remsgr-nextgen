const payloadCommands = new Set([
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

function decodeMSNP(data) {
	const endIndex = data.indexOf('\r\n')
	if (endIndex === -1) return null

	const line = data.slice(0, endIndex).toString('utf-8').trim()
	const parts = line.split(' ')
	if (parts.length < 1) return null

	const command = parts[0]
	let body = null
	let nextIndex = endIndex + 2

	if (payloadCommands.has(command)) {
		const payloadLength = parseInt(parts.pop(), 10)
		if (isNaN(payloadLength) || nextIndex + payloadLength > data.length) {
			return null
		}

		body = data.slice(nextIndex, nextIndex + payloadLength).toString('utf-8')
		nextIndex += payloadLength
	}

	return [parts, body, data.slice(nextIndex)]
}

module.exports = { decodeMSNP }
