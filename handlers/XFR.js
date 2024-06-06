const chalk = require('chalk');
const config = require("../config")

module.exports = (socket, args) => {
    const transactionID = args[0];

    socket.write(`XFR ${transactionID} SB ${config.server.ip}:${config.server.switchboard_port} CKI ${socket.token}\r\n`);
}