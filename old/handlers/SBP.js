const chalk = require('chalk')

module.exports = async (socket, args, command) => {
	socket.write(command + '\r\n')
}
