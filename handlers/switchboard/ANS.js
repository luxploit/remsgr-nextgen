const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketByPassport, getSwitchboardSocketByPassport } = require("../../utils/socket.util");
const { switchboard_chats, checkPending, acceptCall, checkIfChatExists } = require("../../utils/sb.util");
const config = require("../../config");
const crypto = require('crypto');
// const connection = require('../../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const sb_token = args[2];
    const chatroom = args[3];

    const check = getSocketByPassport(email);

    if (!check) {
        console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has an invalid user ID.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    if (check.sb_token !== sb_token) {
        console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has an invalid switchboard token.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    socket.passport = check.passport;
    socket.version = check.version;
    socket.token = check.token;
    socket.userID = check.userID;
    socket.friendly_name = check.friendly_name;

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const chat = checkIfChatExists(chatroom);

    if (!chat) {
        console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has an invalid chatroom.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const pending = checkPending(chatroom, email);

    if (!pending) {
        console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has no pending call.`);
        socket.write(`911 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    acceptCall(chatroom, email, socket);
    socket.chat = chatroom;

    let total = chat.participants.length - 1;

    for (let current = 1; current <= total; current++) {
        let participant = chat.participants[current - 1];

        if (participant.email === email) continue;

        let iro = `IRO ${transactionID} ${current} ${total}`;
        const sbSocket = participant.socket;
    
        if (sbSocket) {
            iro += ` ${participant.email} ${sbSocket.friendly_name}\r\n`;
        } else {
            iro += ` ${participant.email} ${participant}\r\n`;
        }
    
        socket.write(iro);
        
        if (participant.email !== email) {
            sbSocket.write(`JOI ${email} ${socket.friendly_name}\r\n`);
        }
    }

    socket.write(`ANS ${transactionID} OK\r\n`);
    console.log(`${chalk.yellow.bold('[SB: ANS]')} ${socket.remoteAddress} has successfully answered the call.`);
}