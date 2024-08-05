const chalk = require('chalk');
const config = require("../config");
const { verifyJWT } = require("../utils/auth.util");
const { getSocketByUserID } = require("../utils/socket.util");
const validator = require('email-validator');
const Contact = require('../models/Contact');
const User = require('../models/User');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const list = args[1];

    let identifier;
    if (socket.version >= 10) {
        identifier = args[2];
    } else {
        identifier = args[2].split('@')[0];
    }

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
        const query = socket.version >= 10 ? { uuid: identifier } : { username: identifier };
        const user = await User.findOne(query).exec();

        if (!user) {
            console.log(`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that does not exist. (${identifier})`);
            socket.write(`REM ${transactionID} 0\r\n`);
            return;
        }

        const contact = await Contact.findOne({ userID: socket.userID, contactID: user._id, list }).exec();

        if (!contact) {
            console.log(`${chalk.red.bold('[REM]')} ${socket.passport} attempted to remove a contact that is not in their list. (${identifier})`);
            socket.write(`REM ${transactionID} 0\r\n`);
            return;
        }

        await Contact.deleteOne({ userID: socket.userID, contactID: user._id, list }).exec();

        const contactID = user._id.toString();
        const contactSocket = getSocketByUserID(contactID);

        console.log(`${chalk.green.bold('[REM]')} ${socket.passport} removed ${identifier} from their list.`);
        socket.write(`REM ${transactionID} ${list} 1 ${user.username || identifier}@remsgr.net\r\n`);

        if (contactSocket) {
            const contactContact = await Contact.findOne({ userID: user._id, contactID: socket.userID, list }).exec();

            if (!contactContact) {
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
