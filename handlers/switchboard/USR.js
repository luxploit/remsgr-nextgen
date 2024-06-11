const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util");
const { getSocketBySwitchboardToken } = require("../../utils/socket.util");

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const sb_token = args[2];
    console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} is trying to log in with ${email}.`)

    const regularSocket = getSocketBySwitchboardToken(sb_token);

    if (!regularSocket) {
        console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} has an invalid switchboard token.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    socket.passport = regularSocket.passport;
    socket.version = regularSocket.version;
    socket.token = regularSocket.token;

    socket.write(`USR ${transactionID} OK ${socket.passport} ${socket.passport}\r\n`);
    console.log(`${chalk.yellow.bold('[SB: USR]')} ${socket.remoteAddress} has successfully logged in as ${socket.passport}.`);
}