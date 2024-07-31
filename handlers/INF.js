const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];

    // Check if the transaction ID is a number
    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    // Send authentication method
    console.log(`${chalk.greenBright.bold('[INF]')} ${socket.remoteAddress} has requested the authentication method (always MD5, older clients).`);
    socket.write(`INF ${transactionID} MD5\r\n`);
}