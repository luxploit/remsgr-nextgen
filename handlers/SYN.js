const chalk = require('chalk');
const listsInt = require('../data/lists');
const { verifyJWT } = require('../utils/auth.util');
const Contact = require('../models/Contact');
const User = require('../models/User');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const syncID = parseInt(args[1]) + 1;

    if (isNaN(transactionID) || isNaN(syncID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[SYN]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} sister wants CONTACT LIST 💜`);

    if (socket.version >= 10) {
        const lists = ['FL', 'AL', 'BL'];
        const promises = lists.map(list => Contact.find({ userID: socket.userID, list }).exec());
        const reverseList = Contact.find({ contactID: socket.userID, list: 'FL' }).exec();

        const results = await Promise.all(promises);
        const reverse = await reverseList;

        const allContacts = new Set();

        results.forEach(result => {
            result.forEach(contact => {
                allContacts.add(contact.contactID.toString());
            });
        });

        reverse.forEach(contact => {
            allContacts.add(contact.userID.toString());
        });

        const totalContacts = allContacts.size;

        function getFormattedTimestamp() {
            const date = new Date();

            const year = date.getUTCFullYear();
            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
            const day = String(date.getUTCDate()).padStart(2, '0');
            const hours = String(date.getUTCHours()).padStart(2, '0');
            const minutes = String(date.getUTCMinutes()).padStart(2, '0');
            const seconds = String(date.getUTCSeconds()).padStart(2, '0');
            const milliseconds = String(date.getUTCMilliseconds()).padStart(1, '0');

            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}-00:00`;
        }

        const timestamp = getFormattedTimestamp();

        const user = await User.findById(socket.userID).exec();

        const totalGroupsInt = user.groups.length;

        socket.write(`SYN ${transactionID} ${timestamp} ${timestamp} ${totalContacts} ${totalGroupsInt}\r\n`);
        socket.write(`GTC A\r\n`);
        socket.write(`BLP AL\r\n`);
        socket.write(`PRP MFN ${socket.friendly_name}\r\n`);
        if (user.settings.phone.PHH) {
            socket.write(`PRP PHH ${user.settings.phone.PHH}\r\n`);
        }
        if (user.settings.phone.PHM) {
            socket.write(`PRP PHM ${user.settings.phone.PHM}\r\n`);
        }
        if (user.settings.phone.PHW) {
            socket.write(`PRP PHW ${user.settings.phone.PHW}\r\n`);
        }

        if (!user) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} does not exist.`);
            socket.destroy();
            return;
        }

        if (!user.groups) {
            return;
        }

        const groups = user.groups;

        groups.forEach(group => {
            socket.write(`LSG ${group.name} ${group.id}\r\n`);
        });

    } else if (socket.version <= 9) {
        socket.write(`SYN ${transactionID} ${syncID}\r\n`);
        socket.write(`GTC ${transactionID} ${syncID} A\r\n`);
        socket.write(`BLP ${transactionID} ${syncID} AL\r\n`);

        if (socket.version >= 7) {
            const user = await User.findById(socket.userID).exec();

            if (!user) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} does not exist.`);
                socket.destroy();
                return;
            }

            if (!user.groups) {
                return;
            }

            const groups = Array.isArray(user.groups) ? user.groups : JSON.parse(user.groups);
            const totalGroups = groups.length + 1;

            let index = 2;

            socket.write(`LSG ${transactionID} ${syncID} 1 ${totalGroups} 0 Other%20Contacts 0\r\n`);

            groups.forEach(group => {
                socket.write(`LSG ${transactionID} ${syncID} ${index} ${totalGroups} ${index - 1} ${group.name} 0\r\n`);
                index++;
            });
        }
    }

    if (socket.version >= 10) {
        const contacts = await Contact.find({ userID: socket.userID }).exec();
        const reverseContacts = await Contact.find({ contactID: socket.userID, list: 'FL' }).exec();

        if (contacts.length === 0 && reverseContacts.length === 0) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts.`);
            socket.write(`LST ${transactionID} ${syncID} 0\r\n`);
            return;
        }

        let contactsMap = new Map();

        for (const contact of contacts) {
            const user = await User.findById(contact.contactID).exec();

            if (!user) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact that does not exist.`);
                continue;
            }

            const userId = contact.contactID.toString();
            const contactLists = contact.list.split(',').map(list => listsInt[list]);
            const totalListsNumber = contactLists.reduce((acc, num) => acc + num, 0);

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
            } else {
                contactsMap.set(userId, {
                    email: user.username + "@remsgr.net",
                    friendly_name: user.friendly_name,
                    uuid: user.uuid,
                    lists_number: totalListsNumber,
                    settings: user.settings
                });
            }
        }

        for (const contact of reverseContacts) {
            const user = await User.findById(contact.userID).exec();

            if (!user) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a reverse contact that does not exist.`);
                continue;
            }

            const userId = contact.userID.toString();
            const totalListsNumber = listsInt.RL;

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
            } else {
                contactsMap.set(userId, {
                    email: user.username + "@remsgr.net",
                    friendly_name: user.friendly_name,
                    uuid: user.uuid,
                    lists_number: totalListsNumber,
                    settings: user.settings
                });
            }
        }

        const contactsData = Array.from(contactsMap.values());

        for (const contact of contactsData) {
            socket.write(`LST N=${contact.email} F=${contact.friendly_name} C=${contact.uuid} ${contact.lists_number}\r\n`);
            if (contact.settings.phone.PHH) {
                socket.write(`BPR PHH ${contact.settings.phone.PHH}\r\n`);
            }
            if (contact.settings.phone.PHM) {
                socket.write(`BPR PHM ${contact.settings.phone.PHM}\r\n`);
            }
            if (contact.settings.phone.PHW) {
                socket.write(`BPR PHW ${contact.settings.phone.PHW}\r\n`);
            }
        }
    } else {
        try {
            const lists = ['FL', 'AL', 'BL'];
            const queries = lists.map(list => Contact.find({ userID: socket.userID, list }).exec());
            queries.push(Contact.find({ contactID: socket.userID, list: 'FL' }).exec());
            const results = await Promise.all(queries);

            results.forEach(async (result, i) => {
                const list = i < lists.length ? lists[i] : 'RL';
                const contacts = result;

                if (contacts.length === 0) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts in list ${list}.`);
                    socket.write(`LST ${transactionID} ${list} ${syncID} 0 0\r\n`);
                    return;
                }

                const total = contacts.length;
                for (const [index, contact] of contacts.entries()) {
                    const userID = list === 'RL' ? contact.userID : contact.contactID;
                    const user = await User.findById(userID).exec();

                    if (!user) {
                        console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact in list ${list} that does not exist.`);
                        return;
                    }

                    socket.write(`LST ${transactionID} ${list} ${syncID} ${index + 1} ${total} ${user.username + "@remsgr.net"} ${user.friendly_name}${socket.version > 6 ? " 0" : ""}\r\n`);
                }
            });
        } catch (err) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} failed to get contacts from the database.`);
            socket.write(`911 ${transactionID}\r\n`);
        }
    }
}
