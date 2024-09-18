const chalk = require('chalk')

module.exports = async (socket) => {
	console.log(`${chalk.red.bold('[OUT]')} ${socket.passport} has disconnected.`)
	socket.write(`OUT\r\n`)
	socket.destroy()
}
