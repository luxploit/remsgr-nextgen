const chalk = require('chalk');
const config = require("../config")
const auth = require("../utils/auth.util");
const connection = require('../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const friendly_name = args[2];

    const decoded = await auth.verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        return;
    }

    if (decodeURIComponent(friendly_name).length > 387) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has a friendly name that is too long.`);
        socket.write(`REA ${transactionID} 0\r\n`);
        return;
    }

    const d_friendly_name = decodeURIComponent(friendly_name);

    await connection.query('UPDATE users SET friendly_name = ? WHERE id = ?', [d_friendly_name, decoded.id]);

    socket.write(`REA ${transactionID} 1 ${email} ${friendly_name}\r\n`);
}