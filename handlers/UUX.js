const chalk = require('chalk');
const User = require('../models/User');
const Contact = require('../models/Contact');
const { getSocketByUserID } = require('../utils/socket.util');
const { XMLParser } = require('fast-xml-parser');

const parser = new XMLParser();

module.exports = async (socket, args, command) => {
    const transactionID = args[0];

    // Check if the transaction ID is a number
    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    // get payload from the command (get after first \r\n)
    const payload = command.split('\r\n').slice(1).join('\r\n');
    const payloadXML = payload.slice(0, payload.lastIndexOf('>') + 1);

    console.log(payloadXML);

    const parsed = parser.parse(payloadXML);

    console.log(parsed);

    if (parsed.Data.PSM === undefined || parsed.Data.CurrentMedia === undefined) {
        console.log(`${chalk.red.bold('[UUX]')} ${socket.passport} has sent an invalid payload.`);
        return;
    }

    socket.customStatus = payloadXML;

    const payloadLength = Buffer.byteLength(payloadXML, 'utf8');

    // Send acknowledgement
    socket.write(`UUX ${transactionID} 0\r\n`);

    // Send to the entire contact list (FL) that the user has changed their status
    const contacts = await Contact.find({ userID: socket.userID, list: 'FL' }).exec();

    contacts.forEach(async (contact) => {
        const user = await User.findOne({ _id: contact.contactID }).exec();

        if (user) {
            const contactSocket = getSocketByUserID(user._id.toString());

            if (contactSocket < 11) {
                return;
            }

            if (contactSocket) {
                contactSocket.write(`UBX ${socket.passport} ${payloadLength}\r\n${payloadXML}`);
            }
        }
    });
}