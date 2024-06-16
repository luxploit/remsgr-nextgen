const chalk = require('chalk');
const config = require("../config")
const { verifyJWT } = require("../utils/auth.util");
const { getSocketByUserID } = require("../utils/socket.util");
const connection = require('../db/connect').promise();
const validator = require('email-validator');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const list = args[1];
    const email = args[2];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[REM]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    if (['FL', 'BL', 'AL'].includes(list)) {
        if (!validator.validate(email)) {
            console.log(`${chalk.red.bold('[REM]')} ${socket.remoteAddress} has an invalid email address.`);
            socket.write(`REM ${transactionID} 0\r\n`);
            return;
        }

        const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length === 0) {
            console.log(`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that does not exist. (${email})`);
            socket.write(`REM ${transactionID} 0\r\n`);
            return;
        }

        const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [socket.userID, rows[0].id, list]);

        if (contacts.length === 0) {
            console.log(`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that is not in their list. (${email})`);
            socket.write(`REM ${transactionID} 0\r\n`);
            return;
        }

        await connection.query('DELETE FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [socket.userID, rows[0].id, list]);

        const contactSocket = getSocketByUserID(rows[0].id);

        console.log(`${chalk.green.bold('[REM]')} ${socket.passport} removed ${email} from their list.`);
        socket.write(`REM ${transactionID} ${list} 1 ${email}\r\n`);

        if (contactSocket) {
            const [contactContacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [rows[0].id, socket.userID, list]);

            if (contactContacts.length === 0) {
                return;
            }

            contactSocket.write(`FLN ${socket.passport}\r\n`);
        }
    } else {
        console.log(`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact from an invalid list. (${list})`);
        socket.destroy();
        return;
    }
}