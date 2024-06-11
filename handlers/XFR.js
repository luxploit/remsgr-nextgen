const chalk = require('chalk');
const crypto = require('crypto');
const config = require("../config")

module.exports = (socket, args) => {
    const transactionID = args[0];
    console.log(`${chalk.yellow.bold('[XFR]')} ${socket.remoteAddress} is trying to transfer to the switchboard.`);

    let sb_token = null;

    if (!socket.sb_token) {
        const genToken = crypto.randomBytes(16).toString('hex');
        socket.sb_token = genToken;
        sb_token = genToken;
    } else {
        sb_token = socket.sb_token;
    }

    socket.write(`XFR ${transactionID} SB ${config.server.ip}:${config.server.switchboard_port} CKI ${sb_token}\r\n`);
}