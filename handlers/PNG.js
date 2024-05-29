const chalk = require('chalk');

module.exports = (socket, args) => {
    console.log(`${chalk.magenta.bold('[PNG]')} ${socket.remoteAddress} this bitch just pinged to see if we was alive girl bye 😭.`);
    socket.write(`QNG 60\r\n`);
}