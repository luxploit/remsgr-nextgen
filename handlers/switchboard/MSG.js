const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getAllParticipantsSockets } = require("../../utils/sb.util");
const MimeParser = require("../../utils/parsers/mime.util");

module.exports = async (socket, args, command, data) => {
    const state = args[1];
    const messageTotal = args[2].split('\r\n')[0];

    const fullPayload = command.substring(command.indexOf('\r\n') + 2);
    const rawPayload = data.toString('utf8', 0, data.length);

    const payload = rawPayload.substring(rawPayload.indexOf('\r\n') + 2);

    const parser = new MimeParser(fullPayload);

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    const email = socket.passport;

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

    allSockets.forEach(s => {
        s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\n${payload}`);
    });
}