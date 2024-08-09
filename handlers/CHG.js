const chalk = require('chalk');
const { getSocketByUserID } = require('../utils/socket.util');
const { verifyJWT } = require('../utils/auth.util');
const Contact = require('../models/Contact');
const User = require('../models/User');

module.exports = async (socket, args, command) => {
    const transactionID = args[0];
    const status = args[1];
    const capabilities = args[2] || "0";
    const msnobjectpfp = args[3] || '';

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const verified = verifyJWT(socket.token);

    if (!verified) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    const user = await User.findById(socket.userID).exec();

    if (!user) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.passport} has an invalid user ID.`);
        socket.write(`201 ${transactionID}\r\n`);
        socket.destroy();
        return;
    }

    socket.capabilities = capabilities;
    socket.msnobjectpfp = msnobjectpfp;

    if (!['NLN', 'BSY', 'IDL', 'BRB', 'AWY', 'PHN', 'LUN', 'HDN'].includes(status)) {
        console.log(`${chalk.red.bold('[CHG]')} ${socket.passport} has attempted to change their status to an invalid status. (${status})`);
        socket.destroy();
        return;
    }

    if (!socket.initial_status) {
        socket.initial_status = false;
    }

    const contacts = await Contact.find({ userID: socket.userID, list: 'AL' }).exec();

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

        if (status === 'HDN') {
            contactSocket.write(`FLN ${user.username + "@remsgr.net"}\r\n`);
        } else {
            if (contactSocket.version >= 8) {
                contactSocket.write(`NLN ${status} ${user.username + "@remsgr.net"} ${user.friendly_name} ${capabilities}${socket.version >= 9 ? " " + msnobjectpfp : ""}\r\n`);
            } else {
                contactSocket.write(`NLN ${status} ${user.username + "@remsgr.net"} ${user.friendly_name}\r\n`);
            }
        }
    }

    console.log(`${chalk.blue.bold('[CHG]')} ${socket.passport} changed their status to ${status}.`);
    socket.write(command + `\r\n`);
    socket.status = status;

    if (socket.initial_status === false) {
        const contactsFL = await Contact.find({ userID: socket.userID, list: 'FL' }).exec();

        for (const contact of contactsFL) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            const contactContactsAL = await Contact.find({ userID: contact.contactID, contactID: socket.userID, list: 'AL' }).exec();

            if (contactContactsAL.length === 0) {
                continue;
            }

            if (contactSocket.status === 'HDN') {
                continue;
            }

            if (socket.version >= 8) {
                socket.write(`ILN ${transactionID} ${contactSocket.status} ${contactSocket.passport} ${contactSocket.friendly_name} ${contactSocket.capabilities}${socket.version >= 9 ? " " + contactSocket.msnobjectpfp : ""}\r\n`);
                if (socket.version >= 11) {
                    if (contactSocket.customStatus) {
                        const payload = contactSocket.customStatus;
                        const payloadLength = Buffer.byteLength(payload, 'utf8');
                        socket.write(`UBX ${contactSocket.passport} ${payloadLength}\r\n${payload}`);
                    }
                }
            } else {
                socket.write(`ILN ${transactionID} ${contactSocket.status} ${contactSocket.passport} ${contactSocket.friendly_name}\r\n`);
            }
        }

        socket.initial_status = true;
        return;
    }
}
