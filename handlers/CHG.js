const chalk = require('chalk');
const { getSocketByUserID } = require('../utils/socket.util');
const { verifyJWT } = require('../utils/auth.util');
const connection = require('../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const status = args[1];

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE id = ?', [socket.userID]);

    if (rows.length === 0) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.passport} has an invalid user ID.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    if (!['NLN', 'BSY', 'IDL', 'BRB', 'AWY', 'PHN', 'LUN', 'HDN'].includes(status)) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.passport} has attempted to change their status to an invalid status. (${status})`);
        socket.write(`201 ${transactionID}\r\n`);
        return;
    }

    if (!socket.initial_status) {
        socket.initial_status = false;
    }

    const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, 'FL']);

    for (const contact of contacts) {
        const contactSocket = getSocketByUserID(contact.contactID);

        if (!contactSocket) {
            continue;
        }

        const [contactContacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [contact.contactID, socket.userID, 'FL']);

        if (contactContacts.length === 0) {
            continue;
        }

        if (status === 'HDN') {
            contactSocket.write(`FLN ${rows[0].email}\r\n`);
        } else {
            contactSocket.write(`NLN ${status} ${rows[0].email} ${rows[0].friendly_name}\r\n`);
        }
    }

    console.log(`${chalk.blue.bold('[CHG]')} ${socket.passport} changed their status to ${status}.`);
    socket.write(`CHG ${transactionID} ${status}\r\n`);
    socket.status = status;

    if (socket.initial_status === false) {
        const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, 'FL']);

        for (const contact of contacts) {
            const contactSocket = getSocketByUserID(contact.contactID);

            if (!contactSocket) {
                continue;
            }

            if (contactSocket.status === 'HDN') {
                continue;
            }

            const [contactUser] = await connection.query('SELECT * FROM users WHERE id = ?', [contact.contactID]);

            socket.write(`ILN ${transactionID} ${contactSocket.status} ${contactUser[0].email} ${contactUser[0].friendly_name}\r\n`);
        }
        socket.initial_status = true;
        return;
    }
}