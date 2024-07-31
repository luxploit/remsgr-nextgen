const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getAllParticipantsSockets } = require("../../utils/sb.util");
const mailparser = require('mailparser');

module.exports = async (socket, args, command, data) => {
    const transactionID = args[0];
    const acknowledgement = args[1];

    const fullPayload = command.substring(command.indexOf('\r\n') + 2);

    const rawPayload = data;
    const payload = rawPayload.slice(rawPayload.indexOf('\r\n') + 2);

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    const email = socket.passport;

    const parsed = await mailparser.simpleParser(fullPayload);
    // console.log(parsed);
    console.log(parsed.headers.get('content-type'));

    const allSockets = getAllParticipantsSockets(socket.chat, email);

    const messageTotal = payload.length;

    try {
        allSockets.forEach(s => {
            const messageBuffer = Buffer.concat([
                Buffer.from(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n`),
                Buffer.from(payload)
            ]);
            
            s.write(messageBuffer);
        });
        if (acknowledgement == "A" || acknowledgement == "D") {
            socket.write(`ACK ${transactionID}\r\n`);
        }
    } catch (e) {
        switch (acknowledgement) {
            case "N":
                socket.write(`NAK ${transactionID}\r\n`);
                break;
            case "A":
                socket.write(`NAK ${transactionID}\r\n`);
                break;
            case "D":
                socket.write(`NAK ${transactionID}\r\n`);
                break;
            default:
                break;
        }
    }
}