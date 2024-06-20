const chalk = require('chalk');
const connection = require('../db/connect').promise();
const listsInt = require('../data/lists');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const syncID = parseInt(args[1]) + 1;

    if (isNaN(transactionID) || isNaN(syncID)) {
        socket.destroy();
        return;
    }

    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} sister wants CONTACT LIST 💜`);

    if (socket.version >= 10) {
        const lists = ['FL', 'AL', 'BL'];
        const promises = lists.map(list => connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, list]));
        const reverseList = connection.query('SELECT * FROM contacts WHERE contactID = ? AND list = ?', [socket.userID, 'FL']);

        const results = await Promise.all(promises);
        const reverse = await reverseList;

        const allContacts = new Set();

        results.forEach(result => {
            result.forEach(contact => {
                allContacts.add(contact.contactID);
            });
        });

        reverse.forEach(contact => {
            allContacts.add(contact.contactID);
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

        socket.write(`SYN ${transactionID} ${timestamp} ${timestamp} ${totalContacts} 0\r\n`);
        socket.write(`GTC A\r\n`);
        socket.write(`BLP AL\r\n`);
        socket.write(`PRP MFN ${socket.friendly_name}\r\n`);
    } else if (socket.version <= 9) {
        socket.write(`SYN ${transactionID} ${syncID}\r\n`);
        socket.write(`GTC ${transactionID} ${syncID} A\r\n`);
        socket.write(`BLP ${transactionID} ${syncID} AL\r\n`);

        socket.write(`LSG ${transactionID} ${syncID} 1 2 0 Other%20Contacts 0\r\n`);
        socket.write(`LSG ${transactionID} ${syncID} 2 2 1 Favorites 0\r\n`);
    }

    if (socket.version >= 10) {
        const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ?', [socket.userID]);
        const [reverseContacts] = await connection.query('SELECT * FROM contacts WHERE contactID = ? AND list = ?', [socket.userID, 'FL']);

        if (contacts.length === 0 && reverseContacts.length === 0) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts.`);
            socket.write(`LST ${transactionID} ${syncID} 0\r\n`);
            return;
        }

        let contactsMap = new Map();

        for (const contact of contacts) {
            const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [contact.contactID]);

            if (user.length === 0) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact that does not exist.`);
                continue;
            }

            const userId = contact.contactID;
            const contactLists = contact.list.split(',').map(list => listsInt[list]);
            const totalListsNumber = contactLists.reduce((acc, num) => acc + num, 0);

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
            } else {
                contactsMap.set(userId, {
                    email: user[0].email,
                    friendly_name: user[0].friendly_name,
                    uuid: user[0].uuid,
                    lists_number: totalListsNumber
                });
            }
        }

        for (const contact of reverseContacts) {
            const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [contact.userID]);

            if (user.length === 0) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a reverse contact that does not exist.`);
                continue;
            }

            const userId = contact.userID;
            const totalListsNumber = listsInt.RL;

            if (contactsMap.has(userId)) {
                contactsMap.get(userId).lists_number |= totalListsNumber;
            } else {
                contactsMap.set(userId, {
                    email: user[0].email,
                    friendly_name: user[0].friendly_name,
                    uuid: user[0].uuid,
                    lists_number: totalListsNumber
                });
            }
        }

        const contactsData = Array.from(contactsMap.values());

        for (const contact of contactsData) {
            socket.write(`LST N=${contact.email} F=${contact.friendly_name} C=${contact.uuid} ${contact.lists_number}\r\n`);
        }
    } else {
        try {
            const lists = ['FL', 'AL', 'BL'];
            const queries = lists.map(list => connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, list]));
            queries.push(connection.query('SELECT * FROM contacts WHERE contactID = ? AND list = ?', [socket.userID, 'FL']));
            const results = await Promise.all(queries);

            results.forEach((result, i) => {
                const list = i < lists.length ? lists[i] : 'RL';
                const contacts = result[0];

                if (contacts.length === 0) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts in list ${list}.`);
                    socket.write(`LST ${transactionID} ${list} ${syncID} 0 0\r\n`);
                    return;
                }

                const total = contacts.length;
                contacts.forEach(async (contact, index) => {
                    const userID = list === 'RL' ? contact.userID : contact.contactID;
                    const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userID]);

                    if (users.length === 0) {
                        console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact in list ${list} that does not exist.`);
                        return;
                    }

                    const user = users[0];
                    socket.write(`LST ${transactionID} ${list} ${syncID} ${index + 1} ${total} ${user.email} ${user.friendly_name} 0\r\n`);
                });
            });
        } catch (err) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} failed to get contacts from the database.`);
            socket.write(`911 ${transactionID}\r\n`);
        }
    }
}