const chalk = require('chalk');
const crypto = require('crypto');
const config = require("../config")
const { verifyJWT } = require("../utils/auth.util");

module.exports = (socket, args) => {
    const transactionID = args[0];
    console.log(`${chalk.yellow.bold('[XFR]')} ${socket.remoteAddress} is trying to transfer to the switchboard.`);

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.yellow.bold('[XFR]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    let sb_token = null;

    if (!socket.sb_token) {
        const genToken = crypto.randomBytes(16).toString('hex');
        socket.sb_token = genToken;
        sb_token = genToken;
    } else {
        sb_token = socket.sb_token;
    }

    socket.write(`XFR ${transactionID} SB ${config.server.ip}:${config.server.switchboard_port} CKI ${sb_token}${socket.version >= 13 ? " U " + config.server.host : ""}${socket.version >= 14 ? " 1" : ""}\r\n`);
}