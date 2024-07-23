const chalk = require('chalk');
const { verifyJWT } = require("../utils/auth.util");
const { getSwitchboardSocketByPassport, getSocketByUserID } = require("../utils/socket.util");

const User = require('../models/User');
const Contact = require('../models/Contact');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const email = args[1];
    const friendly_name = args[2];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    const user = await User.findById(decoded.id).exec();

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

    if (email == user.email && socket.passport == email) {
        await User.updateOne({ _id: decoded.id }, { friendly_name }).exec();

        const sbSocket = getSwitchboardSocketByPassport(email);

        if (sbSocket) {
            sbSocket.friendly_name = friendly_name;
        }

        socket.friendly_name = friendly_name;

        const contacts = await Contact.find({ userID: socket.userID, list: 'FL' }).exec();

        for (const contact of contacts) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            const contactContacts = await Contact.find({ userID: contact.contactID, contactID: socket.userID, list: 'FL' }).exec();

            if (contactContacts.length === 0) {
                continue;
            }

            contactSocket.write(`NLN ${socket.status} ${socket.passport} ${socket.friendly_name}\r\n`);
        }
    }

    socket.write(`REA ${transactionID} 1 ${email} ${friendly_name}\r\n`);
}
