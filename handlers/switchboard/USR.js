const chalk = require('chalk');
const config = require("../../config")

module.exports = (socket, args) => {
    const transactionID = args[0];
    const email = args[1];

    socket.write(`USR ${transactionID} OK ${email} ${email}\r\n`);
}