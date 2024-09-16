const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketByPassport } = require("../../utils/socket.util");
const { switchboard_chats } = require("../../utils/sb.util");
const config = require("../../config");
const crypto = require('crypto');

const User = require("../../models/User");
const Contact = require("../../models/Contact");

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    if (!email) {
        socket.write(`210 ${transactionID}\r\n`);
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

    const username = socket.passport.split('@')[0];
    const contactUsername = email.split('@')[0];

    const user = await User.findOne({ username }).exec();
    const contact = await User.findOne({ username: contactUsername }).exec();

    const blocked = await Contact.findOne({ userID: user._id, contactID: contact._id, list: 'BL' });
    const blockedBy = await Contact.findOne({ userID: contact._id, contactID: user._id, list: 'BL' });

    if (blocked || blockedBy) {
        console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} is blocked by ${email}.`);
        socket.write(`217 ${transactionID}\r\n`);
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
    regularSocket.write(`RNG ${socket.chat} ${config.server.ip}:${config.server.switchboard_port} CKI ${sb_token} ${socket.passport} ${socket.friendly_name}${regularSocket.version >= 13 ? " U " + config.server.host : ""}${regularSocket.version >= 14 ? " 1" : ""}\r\n`);
    console.log(`${chalk.yellow.bold('[SB: CAL]')} ${socket.remoteAddress} has successfully called ${email}.`);
}