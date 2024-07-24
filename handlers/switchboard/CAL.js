const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketByPassport } = require("../../utils/socket.util");
const { switchboard_chats } = require("../../utils/sb.util");
const config = require("../../config");
const crypto = require('crypto');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} is trying to call ${email}.`)

    if (!socket.chat) {
        console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} has no chatroom assigned, cannot call.`);
        socket.write(`280 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const regularSocket = getSocketByPassport(email);

    if (!regularSocket) {
        console.log(`${chalk.yellow.bold('[SB: CAL]')} ${email} is not online or doesn't exist.`);
        socket.write(`217 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    let sb_token = null;

    if (!regularSocket.sb_token) {
        const genToken = crypto.randomBytes(16).toString('hex');
        regularSocket.sb_token = genToken;
        sb_token = genToken;
    } else {
        sb_token = regularSocket.sb_token;
    }

    const chat = switchboard_chats.find(c => c.chatID === socket.chat);
    chat.pending.push(email);

    socket.write(`CAL ${transactionID} RINGING ${socket.chat}\r\n`);
    regularSocket.write(`RNG ${socket.chat} ${config.server.ip}:${config.server.switchboard_port} CKI ${sb_token} ${socket.passport} ${socket.friendly_name}\r\n`);
    console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} has successfully called ${email}.`);
}