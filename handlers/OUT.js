const chalk = require('chalk');

module.exports = (socket) => {
    socket.write(`OUT\r\n`);
    socket.destroy();
}