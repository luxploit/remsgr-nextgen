const chalk = require('chalk');
const config = require("../config")
const { verifyJWT } = require("../utils/auth.util");
const { getSwitchboardSocketByPassport, getSocketByUserID } = require("../utils/socket.util");
const connection = require('../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const friendly_name = args[2];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    if (friendly_name.length > 387) {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has a friendly name that is too long.`);
        socket.write(`REA ${transactionID} 0\r\n`);
        return;
    }

    if (email == decoded.email && socket.passport == email) {
        await connection.query('UPDATE users SET friendly_name = ? WHERE id = ?', [friendly_name, decoded.id]);

        const sbSocket = getSwitchboardSocketByPassport(email);
    
        if (sbSocket) {
            sbSocket.friendly_name = friendly_name;
            return;
        }
    
        socket.friendly_name = friendly_name;
    
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
    
            contactSocket.write(`NLN ${socket.status} ${socket.passport} ${socket.friendly_name}\r\n`);
        }
    }

    socket.write(`REA ${transactionID} 1 ${email} ${friendly_name}\r\n`);
}