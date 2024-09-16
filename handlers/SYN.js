const chalk = require('chalk');
const { lists : listsInt } = require('../data/lists');
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

    if (socket.version >= 13) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);
    if (!decoded) {
        console.log(`${chalk.red.bold('[SYN]')} ${socket.remoteAddress} has an invalid token.`);
        socket.destroy();
        return;
    }

    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} asked for contact list.`);

    let user, contacts, reverseContacts;
    if (socket.version >= 10) {
        [user, contacts, reverseContacts] = await Promise.all([
            User.findById(socket.userID).exec(),
            Contact.find({ userID: socket.userID }).exec(),
            Contact.find({ contactID: socket.userID, list: 'FL' }).exec()
        ]);

        if (!user) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} does not exist.`);
            socket.destroy();
            return;
        }
    }

    const getFormattedTimestamp = () => {
        const date = new Date();
        return date.toISOString().replace('Z', '-00:00');
    };

    if (socket.version >= 10) {
        const lists = ['FL', 'AL', 'BL'];
        const results = await Promise.all(
            lists.map(list => Contact.find({ userID: socket.userID, list }).exec())
        );
        const allContacts = new Set();

        results.forEach(result => result.forEach(contact => allContacts.add(contact.contactID.toString())));
        reverseContacts.forEach(contact => allContacts.add(contact.userID.toString()));

        const totalContacts = allContacts.size;
        const timestamp = getFormattedTimestamp();
        const totalGroupsInt = user.groups.length;

        socket.write(`SYN ${transactionID} ${timestamp} ${timestamp} ${totalContacts} ${totalGroupsInt}\r\n`);
        socket.write(`GTC A\r\n`);
        socket.write(`BLP AL\r\n`);
        socket.write(`PRP MFN ${socket.friendly_name}\r\n`);

        const { PHH, PHM, PHW } = user.settings.phone;
        if (PHH) socket.write(`PRP PHH ${PHH}\r\n`);
        if (PHM) socket.write(`PRP PHM ${PHM}\r\n`);
        if (PHW) socket.write(`PRP PHW ${PHW}\r\n`);

        user.groups.forEach(group => {
            socket.write(`LSG ${group.name} ${group.id}\r\n`);
        });

        const contactsMap = new Map();

        for (const contact of contacts) {
            const userId = contact.contactID.toString();
            const totalListsNumber = contact.list.split(',').map(list => listsInt[list]).reduce((acc, num) => acc + num, 0);

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
                if (contact.list === 'FL') {
                    contactsMap.get(userId).groups.push(contact.groups);
                }
            } else {
                const contactUser = await User.findById(contact.contactID).exec();
                if (!contactUser) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact that does not exist.`);
                    continue;
                }
                contactsMap.set(userId, {
                    email: contactUser.username + "@remsgr.net",
                    friendly_name: contactUser.friendly_name,
                    uuid: contactUser.uuid,
                    lists_number: totalListsNumber,
                    groups: contact.groups,
                    settings: contactUser.settings
                });
            }
        }

        for (const contact of reverseContacts) {
            const userId = contact.userID.toString();
            const totalListsNumber = listsInt.RL;

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
            } else {
                const contactUser = await User.findById(contact.userID).exec();
                if (!contactUser) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a reverse contact that does not exist.`);
                    continue;
                }
                contactsMap.set(userId, {
                    email: contactUser.username + "@remsgr.net",
                    friendly_name: contactUser.friendly_name,
                    uuid: contactUser.uuid,
                    lists_number: totalListsNumber,
                    groups: [],
                    settings: contactUser.settings
                });
            }
        }

        const contactsData = Array.from(contactsMap.values());

        for (const contact of contactsData) {
            const phoneDetails = [];
            if (contact.settings.phone.PHH) phoneDetails.push(`BPR PHH ${contact.settings.phone.PHH}`);
            if (contact.settings.phone.PHM) phoneDetails.push(`BPR PHM ${contact.settings.phone.PHM}`);
            if (contact.settings.phone.PHW) phoneDetails.push(`BPR PHW ${contact.settings.phone.PHW}`);

            socket.write(`LST N=${contact.email} F=${contact.friendly_name} C=${contact.uuid} ${contact.lists_number}${socket.version >= 12 ? " 1" : ""} ${contact.groups.join(',')}\r\n`);
            if (phoneDetails.length > 0) {
                socket.write(phoneDetails.join('\r\n') + '\r\n');
            }
        }

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

            if (!user.groups) return;

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

    if (socket.version < 10) {
        try {
            const lists = ['FL', 'AL', 'BL'];
            const queries = lists.map(list => Contact.find({ userID: socket.userID, list }).exec());
            queries.push(Contact.find({ contactID: socket.userID, list: 'FL' }).exec());

            const results = await Promise.all(queries);

            for (let i = 0; i < results.length; i++) {
                const list = i < lists.length ? lists[i] : 'RL';
                const contacts = results[i];

                if (contacts.length === 0) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts in list ${list}.`);
                    socket.write(`LST ${transactionID} ${list} ${syncID} 0 0\r\n`);
                    continue;
                }

                const total = contacts.length;
                for (const [index, contact] of contacts.entries()) {
                    const userID = list === 'RL' ? contact.userID : contact.contactID;
                    const user = await User.findById(userID).exec();

                    if (!user) {
                        console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact in list ${list} that does not exist.`);
                        continue;
                    }

                    socket.write(`LST ${transactionID} ${list} ${syncID} ${index + 1} ${total} ${user.username + "@remsgr.net"} ${user.friendly_name}${socket.version > 6 ? " 0" : ""}\r\n`);
                }
            }
        } catch (err) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} failed to get contacts from the database.`);
            socket.write(`911 ${transactionID}\r\n`);
        }
    }
};
