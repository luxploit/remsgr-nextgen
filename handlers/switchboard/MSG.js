const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getAllParticipantsSockets } = require("../../utils/sb.util");
const MimeParser = require("../../utils/parsers/mime.util");

module.exports = async (socket, args, command) => {
    const state = args[1];
    const messageTotal = args[2].split('\r\n')[0];

    const fullPayload = command.substring(command.indexOf('\r\n') + 2);

    const parser = new MimeParser(fullPayload);

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[MSG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    const allSockets = getAllParticipantsSockets(socket.chat, decoded.email);

    if (parser.getHeader('TypingUser')) {
        allSockets.forEach(s => {
            s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\nMIME-Version: ${parser.getHeader('MIME-Version')}\r\nContent-Type: text/x-msmsgscontrol\r\nTypingUser: ${parser.getHeader('TypingUser')}\r\n\r\n\r\n`);
        });
        return;
    }

    if (parser.getHeader('Content-Type') == "text/plain; charset=UTF-8") {
        allSockets.forEach(s => {
            s.write(`MSG ${socket.passport} ${socket.friendly_name} ${messageTotal}\r\nMIME-Version: ${parser.getHeader('MIME-Version')}\r\nContent-Type: text/plain; charset=UTF-8\r\n${parser.getHeader('X-MMS-IM-Format') ? `X-MMS-IM-Format: ${parser.getHeader('X-MMS-IM-Format')}\r\n` : ''}\r\n${parser.getContent()}`);
        });
        return;
    }
}