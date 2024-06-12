const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketByPassport, getSwitchboardSocketByPassport } = require("../../utils/socket.util");
const { getAllParticipants } = require("../../utils/sb.util");
const config = require("../../config");
const crypto = require('crypto');
// const connection = require('../../db/connect').promise();

module.exports = async (socket, args, command) => {
    const transactionID = args[0];
    const state = args[1];
    const messageTotal = args[2].split('\r\n')[0];

    const fullPayload = command.substring(command.indexOf('\r\n') + 2);

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    const participants = getAllParticipants(socket.chat, socket.passport);

    if (!participants) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.passport} has attempted to send a message to a chat that does not exist. (${email})`);
        socket.write(`911 ${transactionID}\r\n`);
        return;
    }

    participants.forEach(participant => {
        const userSocket = getSwitchboardSocketByPassport(participant);

        if (userSocket) {
            if (state === 'U') {
                userSocket.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${fullPayload}\r\n\r\n`);
            } else if (state === 'N') {
                userSocket.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${fullPayload}`);
            } else {
                userSocket.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${fullPayload}`);
            }
        }
    });
}