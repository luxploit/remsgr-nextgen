const chalk = require('chalk');
const { verifyJWT } = require("../../utils/auth.util")

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const token = args[2];

    const verified = await verifyJWT(token);

    if (!verified) {
        socket.write(`911 4\r\n`);
        return;
    }

    if (email !== verified.email) {
        socket.write(`911 4\r\n`);
        return;
    }

    socket.token = token;
    socket.write(`USR ${transactionID} OK ${verified.email} ${verified.email}\r\n`);
}