const chalk = require('chalk');
const config = require("../config")
const { verifyJWT } = require("../utils/auth.util");
const { getSwitchboardSocketByPassport } = require("../utils/socket.util");
const connection = require('../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const friendly_name = args[2];

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    if (email !== decoded.email) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has attempted to change a user that is not theirs.`);
        socket.write(`REA ${transactionID} 0\r\n`);
        return;
    }

    if (friendly_name.length > 129) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has a friendly name that is too long.`);
        socket.write(`REA ${transactionID} 0\r\n`);
        return;
    }

    await connection.query('UPDATE users SET friendly_name = ? WHERE id = ?', [friendly_name, decoded.id]);

    const sbSocket = getSwitchboardSocketByPassport(email);

    if (sbSocket) {
        sbSocket.friendly_name = friendly_name;
        return;
    }

    socket.friendly_name = friendly_name;
    socket.write(`REA ${transactionID} 1 ${email} ${friendly_name}\r\n`);
}