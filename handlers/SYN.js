const chalk = require('chalk');
const connection = require('../db/connect').promise();

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const syncID = parseInt(args[1]) + 1;

    if (isNaN(transactionID) || isNaN(syncID)) {
        socket.destroy();
        return;
    }

    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} sister wants CONTACT LIST 💜`);
    socket.write(`SYN ${transactionID} ${syncID}\r\n`);
    socket.write(`GTC ${transactionID} ${syncID} A\r\n`);
    socket.write(`BLP ${transactionID} ${syncID} AL\r\n`);

    if (socket.version >= 7) {
        socket.write(`LSG ${transactionID} ${syncID} 1 2 0 Other%20Contacts 0\r\n`);
        socket.write(`LSG ${transactionID} ${syncID} 2 2 1 Favorites 0\r\n`);
    }

    try {
        const lists = ['FL', 'AL', 'BL'];
        const promises = lists.map(list => connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, list]));

        const results = await Promise.all(promises);

        for (let i = 0; i < lists.length; i++) {
            const list = lists[i];
            const contacts = results[i][0];

            if (contacts.length === 0) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no contacts in list ${list}.`);
                socket.write(`LST ${transactionID} ${list} ${syncID} 0 0\r\n`);
                continue;
            }

            const total = contacts.length;

            for (let index = 0; index < total; index++) {
                const contact = contacts[index];
                const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [contact.contactID]);

                if (users.length === 0) {
                    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact in list ${list} that does not exist.`);
                    continue;
                }

                const user = users[0];
                const contactEmail = user.email;
                const contactName = user.friendly_name;

                socket.write(`LST ${transactionID} ${list} ${syncID} ${index + 1} ${total} ${contactEmail} ${contactName} 0\r\n`);
            }
        }
    } catch (err) {
        console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} failed to get contacts from the database.`);
        socket.write(`911 ${transactionID}\r\n`);
    }

    try {
        const [reverseList] = await connection.query('SELECT * FROM contacts WHERE contactID = ? AND list = ?', [socket.userID, 'FL']);

        if (reverseList.length === 0) {
            console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has no one in their reverse list.`);
            socket.write(`LST ${transactionID} RL ${syncID} 0 0\r\n`);
            return;
        }

        const total = reverseList.length;

        for (let index = 0; index < total; index++) {
            const contact = reverseList[index];
            const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [contact.userID]);

            if (users.length === 0) {
                console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} has a contact in their reverse list that does not exist.`);
                continue;
            }

            const user = users[0];
            const contactEmail = user.email;
            const contactName = user.friendly_name;

            socket.write(`LST ${transactionID} RL ${syncID} ${index + 1} ${total} ${contactEmail} ${contactName} 0\r\n`);
        }
    } catch (err) {
        console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} failed to get reverse list from the database.`);
        socket.write(`911 ${transactionID}\r\n`);
    }

    // socket.write(`LST ${transactionID} FL ${syncID} 1 1 default@butterfly.net default 0\r\n`);
    // socket.write(`LST ${transactionID} AL ${syncID} 1 1 default@butterfly.net default\r\n`);
    // socket.write(`LST ${transactionID} BL ${syncID} 0 0\r\n`);
    // socket.write(`LST ${transactionID} RL ${syncID} 1 1 default@butterfly.net default\r\n`);
}