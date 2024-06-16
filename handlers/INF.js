const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    console.log(`${chalk.greenBright.bold('[INF]')} ${socket.remoteAddress} has requested the authentication method (always MD5, older clients).`);
    socket.write(`INF ${transactionID} MD5\r\n`);
}