const chalk = require('chalk');
const { getSocketByUserID } = require('../utils/socket.util');
const connection = require('../db/connect').promise();

module.exports = async (socket) => {
    console.log(`${chalk.red.bold('[OUT]')} ${socket.passport} has disconnected.`);
    socket.write(`OUT\r\n`);
    socket.destroy();
};
