const chalk = require('chalk');

module.exports = async (socket, args, command) => {
    console.log(command)
    socket.write(command + '\r\n');
};
