const chalk = require('chalk')

module.exports = (socket, args) => {
	const transactionID = args[0]
	const version = args[6]

	// Check if the transaction ID is a number
	if (isNaN(transactionID)) {
		socket.destroy()
		return
	}

	// Send client information
	console.log(`${chalk.green.bold('[CVR]')} ${socket.remoteAddress} has sent client information.`)
	socket.write(
		`CVR ${transactionID} ${version} ${version} ${version} https://www.youtube.com/watch?v=zUtTpuqV55U https://www.youtube.com/watch?v=zUtTpuqV55U\r\n`
	)
}
