const chalk = require('chalk');

module.exports = (socket, args) => {
    // console.log(`${chalk.red.bold('[VER]')} ${socket.remoteAddress} has sent supported versions, these are: ${supported.join(', ')}.`);
    socket.write(`OUT\r\n`);
}