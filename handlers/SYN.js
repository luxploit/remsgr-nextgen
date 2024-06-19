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
        // the SYN command is different for MSNP10 and higher versions
        // SYN TRANSACTIONID TIMESTAMP (FORMAT: 2000-01-01T00:00:00.0-00:00) TIMESTAMP (FORMAT: 2000-01-01T00:00:00.0-00:00) TOTALCONTACTS TOTALGROUPS
        // get the number of contacts in each list (including reverse) and add them up to get the total contacts

        const lists = ['FL', 'AL', 'BL'];
        const promises = lists.map(list => connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [socket.userID, list]));
        const reverseList = connection.query('SELECT * FROM contacts WHERE contactID = ? AND list = ?', [socket.userID, 'FL']);

        const results = await Promise.all(promises);
        const reverse = await reverseList;

        const totalContacts = results.reduce((acc, result) => acc + result[0].length, 0) + reverse[0].length;

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

    // todo: code msnp10> syn : okay so for msnp10 and higher it uses numbers instead of letters for the lists, all the numbers from the lists get added up and then the total is sent as the number, & we can use a bitwise AND to check if a user is in the list

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
    

    // socket.write(`LST ${transactionID} FL ${syncID} 1 1 default@butterfly.net default 0\r\n`);
    // socket.write(`LST ${transactionID} AL ${syncID} 1 1 default@butterfly.net default\r\n`);
    // socket.write(`LST ${transactionID} BL ${syncID} 0 0\r\n`);
    // socket.write(`LST ${transactionID} RL ${syncID} 1 1 default@butterfly.net default\r\n`);
}