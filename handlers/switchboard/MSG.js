const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getAllParticipantsSockets } = require("../../utils/sb.util");
// const MimeParser = require("../../utils/parsers/mime.util");
const mailparser = require('mailparser');

module.exports = async (socket, args, command, data) => {
    const transactionID = args[0];
    const acknowledgement = args[1];

    const fullPayload = command.substring(command.indexOf('\r\n') + 2);
    const rawPayload = data.toString('utf8', 0, data.length);

    const payload = rawPayload.substring(rawPayload.indexOf('\r\n') + 2);

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    const email = socket.passport;

    // parse the full payload
    const parsed = await mailparser.simpleParser(fullPayload);

    // console log the parsed email
    console.log(parsed);

    const allSockets = getAllParticipantsSockets(socket.chat, email);

    //if (parser.getHeader('TypingUser')) {
    //    allSockets.forEach(s => {
    //        s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${payload}`);
    //    });
    //    return;
    //}
//
    //if (parser.getHeader('Content-Type') == "text/plain; charset=UTF-8") {
    //    allSockets.forEach(s => {
    //        s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${payload}`);
    //    });
    //    return;
    //}

    // get length of message
    const messageTotal = Buffer.byteLength(payload, 'utf8');

    try {
        allSockets.forEach(s => {
            s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${payload}`);
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