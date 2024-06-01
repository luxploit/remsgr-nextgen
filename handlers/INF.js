const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];

    console.log(`${chalk.blue.bold('[INF]')} ${socket.remoteAddress} this sister wants to know if we support md5... girl DUHHH 😭`);
    socket.write(`INF ${transactionID} MD5\r\n`);
}