const chalk = require('chalk');
const { getSocketByUserID } = require('../utils/socket.util');
const connection = require('../db/connect').promise();

module.exports = async (socket) => {
    console.log(`${chalk.red.bold('[OUT]')} ${socket.passport} has disconnected.`);

    try {
        const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, 'AL']);
        
        for (const contact of contacts) {
            const contactSocket = getSocketByUserID(contact.contactID);

            if (!contactSocket) {
                continue;
            }

            const [contactContacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [contact.contactID, socket.userID, 'AL']);

            if (contactContacts.length > 0) {
                contactSocket.write(`FLN ${socket.passport}\r\n`);
            }
        }

        socket.write(`OUT\r\n`);
    } catch (err) {
        console.log(`${chalk.red.bold('[OUT]')} ${socket.passport} failed to get contacts from the database.`);
        socket.write(`911\r\n`);
    } finally {
        socket.destroy();
    }
};
