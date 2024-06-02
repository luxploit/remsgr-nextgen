const chalk = require('chalk');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const status = args[1];

    if (!socket.initial_status) {
        socket.initial_status = false;
    }

    console.log(`${chalk.blue.bold('[CHG]')} ${socket.passport} changed their status to ${status}.`);
    socket.write(`CHG ${transactionID} ${status}\r\n`);

    if (socket.initial_status === false) {
        console.log(`${chalk.blue.bold('[CHG]')} ${socket.passport} ${socket.status_amount}`);
        socket.write(`ILN ${transactionID} NLN default@butterfly.net default\r\n`);
        socket.initial_status = true;
        return;
    }
}