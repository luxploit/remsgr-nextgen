const chalk = require('chalk');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { getSocketByUserID } = require('../utils/socket.util');

module.exports = async (socket, args, command) => {
    const transactionID = args[0];

    // Check if the transaction ID is a number
    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    // get payload from the command (get after first \r\n)
    const payload = command.split('\r\n').slice(1).join('\r\n');

    socket.customStatus = payload;

    const payloadLength = Buffer.byteLength(payload, 'utf8');

    // Send to the entire contact list (FL) that the user has changed their status
    const contacts = await Contact.find({ userID: socket.userID, list: 'FL' }).exec();

    console.log(contacts)

    contacts.forEach(async (contact) => {
        const user = await User.findOne({ _id: contact.contactID }).exec();

        if (user) {
            const contactSocket = getSocketByUserID(user._id.toString());

            if (contactSocket) {
                contactSocket.write(`UBX ${socket.passport} ${payloadLength}\r\n${payload}`);
            }
        }
    });

    // Send acknowledgement
    socket.write(`UUX ${transactionID} 0\r\n`);
}