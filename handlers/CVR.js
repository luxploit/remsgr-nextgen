const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const version = args[6];

    console.log(`${chalk.green.bold('[CVR]')} ${socket.remoteAddress} has sent client information.`);
    socket.write(`CVR ${transactionID} ${version} ${version} ${version} https://youtu.be/phuiiNCxRMg https://youtu.be/phuiiNCxRMg\r\n`);
}