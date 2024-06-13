const chalk = require('chalk');
const crypto = require('crypto');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketBySwitchboardToken } = require("../../utils/socket.util");
const { switchboard_chats } = require("../../utils/sb.util");

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const sb_token = args[2];
    console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} is trying to log in with ${email}.`)

    const regularSocket = getSocketBySwitchboardToken(sb_token);

    if (!regularSocket) {
        console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} has an invalid switchboard token.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    socket.passport = regularSocket.passport;
    socket.version = regularSocket.version;
    socket.token = regularSocket.token;
    socket.userID = regularSocket.userID;
    socket.friendly_name = regularSocket.friendly_name;

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    let chatID = generateNumericID();

    switchboard_chats.push({ chatID, participants: [{ email: socket.passport, socket }], pending: [] });

    socket.chat = chatID;

    socket.write(`USR ${transactionID} OK ${socket.passport} ${socket.passport}\r\n`);
    console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} has successfully logged in as ${socket.passport}.`);
}

function generateNumericID() {
    let id = '';
    while (id.length < 10) {
        id += crypto.randomInt(0, 10);
    }
    return id;
}