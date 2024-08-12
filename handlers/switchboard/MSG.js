const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getAllParticipantsSockets } = require("../../utils/sb.util");
const mailparser = require('mailparser');

module.exports = async (socket, args, command, payload) => {
    const transactionID = args[0];
    const acknowledgement = args[1];

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    const email = socket.passport;

    const parsed = await mailparser.simpleParser(payload.toString());
    console.log(parsed.headers.get('content-type'));
    console.log(parsed);

    const allSockets = getAllParticipantsSockets(socket.chat, email);
    const messageTotal = payload.length;

    let failed = false;

    try {
        try {
            allSockets.forEach(s => {
                const messageBuffer = Buffer.concat([
                    Buffer.from(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n`),
                    payload
                ]);
    
                s.write(messageBuffer);
            });
        } catch (e) {
            failed = true;
        }

        if (failed && (acknowledgement === "N" || acknowledgement === "A" || acknowledgement === "D")) {
            socket.write(`NAK ${transactionID}\r\n`);
            return;
        }

        if (acknowledgement === "A" || acknowledgement === "D") {
            socket.write(`ACK ${transactionID}\r\n`);
        }
    } catch (e) {
        if (acknowledgement === "N" || acknowledgement === "A" || acknowledgement === "D") {
            socket.write(`NAK ${transactionID}\r\n`);
        }
        console.error(e);
    }
};
