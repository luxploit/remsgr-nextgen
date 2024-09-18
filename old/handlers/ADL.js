const chalk = require('chalk')
const { v4 } = require('uuid')

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

module.exports = async (socket, args) => {
	const transactionID = args[0]

	socket.write(`ADL ${transactionID} OK\r\n`)
}
