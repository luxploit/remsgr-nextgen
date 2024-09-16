const chalk = require('chalk');
const { verifyJWT } = require("../utils/auth.util");
const { getSwitchboardSocketByPassport, getSocketByUserID } = require("../utils/socket.util");

const User = require('../models/User');
const Contact = require('../models/Contact');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const type = args[1];
    const newSetting = args[2];

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

    const user = await User.findById(decoded.id).exec();
    const contacts = await Contact.find({ userID: socket.userID, list: 'FL' }).exec();

    if (type === "MFN") {
        if (newSetting.length > 387) {
            console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has a friendly name that is too long.`);
            socket.write(`REA ${transactionID} 0\r\n`);
            return;
        }

        user.friendly_name = newSetting;
        await user.save();

        const sbSocket = getSwitchboardSocketByPassport(socket.passport);

        if (sbSocket) {
            sbSocket.friendly_name = newSetting;
        }

        socket.friendly_name = newSetting;
        socket.write(`PRP ${transactionID} MFN ${newSetting}\r\n`);

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

            if (contactSocket.version >= 8) {
                contactSocket.write(`NLN ${socket.status} ${socket.passport} ${contactSocket.version >= 14 ? "1 " : ""}${socket.friendly_name} ${socket.capabilities}${contactSocket.version >= 9 ? " " + socket.msnobjectpfp : ""}\r\n`);
            } else {
                contactSocket.write(`NLN ${socket.status} ${socket.passport} ${socket.friendly_name}\r\n`);
            }
        }
    } else if (type === "PHH") {
        if (!user) {
            console.log(`${chalk.red.bold('[REA]')} ${socket.passport} does not exist.`);
            socket.destroy();
            return;
        }

        await User.updateOne(
            { _id: decoded.id },
            { $set: { 'settings.phone.PHH': newSetting } }
        ).exec();

        socket.write(`PRP ${transactionID} PHH ${newSetting}\r\n`);

        for (const contact of contacts) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            contactSocket.write(`BPR ${socket.passport} PHH ${newSetting}\r\n`);
        }
    } else if (type === "PHW") {
        if (!user) {
            console.log(`${chalk.red.bold('[REA]')} ${socket.passport} does not exist.`);
            socket.destroy();
            return;
        }

        await User.updateOne(
            { _id: decoded.id },
            { $set: { 'settings.phone.PHW': newSetting } }
        ).exec();

        socket.write(`PRP ${transactionID} PHW ${newSetting}\r\n`);

        for (const contact of contacts) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            contactSocket.write(`BPR ${socket.passport} PHW ${newSetting}\r\n`);
        }
    } else if (type === "PHM") {
        if (!user) {
            console.log(`${chalk.red.bold('[REA]')} ${socket.passport} does not exist.`);
            socket.destroy();
            return;
        }

        await User.updateOne(
            { _id: decoded.id },
            { $set: { 'settings.phone.PHM': newSetting } }
        ).exec();

        socket.write(`PRP ${transactionID} PHM ${newSetting}\r\n`);

        for (const contact of contacts) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            contactSocket.write(`BPR ${socket.passport} PHM ${newSetting}\r\n`);
        }
    } else {
        console.log(`${chalk.red.bold('[REA]')} ${socket.remoteAddress} has an invalid setting type.`);
        socket.write(`200 ${transactionID}\r\n`);
    }
}
