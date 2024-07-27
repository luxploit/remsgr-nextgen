const chalk = require('chalk');

module.exports = (socket, args) => {
    socket.write(`QNG 60\r\n`);
}