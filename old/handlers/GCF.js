const chalk = require('chalk')

module.exports = async (socket, args) => {
	const transactionID = args[0]

	const shields = `<?xml version="1.0" encoding="utf-8" ?>
    <config>
        <shield><cli maj="7" min="0" minbld="0" maxbld="9999" deny=" " /></shield>
        <block></block>
    </config>`

	const encodedShields = Buffer.from(shields, 'utf-8')
	const encodedShieldsLength = encodedShields.length

	// Check if the transaction ID is a number
	if (isNaN(transactionID)) {
		socket.destroy()
		return
	}

	if (socket.version <= 12) {
		const requestedFile = args[1]

		switch (requestedFile) {
			case 'Shields.xml':
				console.log(
					`${chalk.green.bold('[GCF]')} ${socket.remoteAddress} has requested Shields.xml`
				)
				socket.write(
					`GCF ${transactionID} Shields.xml ${encodedShieldsLength}\r\n${encodedShields}`
				)
				break
			default:
				console.log(
					`${chalk.red.bold('[GCF]')} ${socket.remoteAddress} has requested an unknown file. (${requestedFile})`
				)
				socket.write(`GCF ${transactionID} 0\r\n`)
				break
		}
	}
}
