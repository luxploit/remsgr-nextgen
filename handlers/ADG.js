const chalk = require('chalk');
const config = require("../config")
const { verifyJWT } = require("../utils/auth.util");
const connection = require('../db/connect').promise();
const { v4: uuidv4 } = require('uuid');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const groupName = args[1];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[ADG]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    // this is to create a group, the groups are in the users table in the groups column which is a json that looks like this {"2f7dcecf-120a-4d89-88ff-3ffc18d90b83": "Favorites", "fcc7baca-e61e-48e2-ba6e-3cd728f12dad": "Co-Workers"}, to make a new group we need to add a new key value pair to the json, make sure there isn't 30 groups already, if so return 223, if the group's name is 61 bytes (url encoded, so don't decode it) long return a 229, we also need to get the number of the group being created (by counting the keys in the json and adding 1)

    const [user] = await connection.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

    if (user[0].groups === null) {
        user[0].groups = {};
    }

    let groups = {};

    if (typeof user[0].groups === 'object') {
        groups = user[0].groups;
    } else if (typeof user[0].groups === 'string') {
        groups = JSON.parse(user[0].groups);
    }

    if (Object.keys(groups).length >= 30) {
        console.log(`${chalk.red.bold('[ADG]')} ${socket.passport} has attempted to create a group when they already have 30 groups.`);
        socket.write(`223 ${transactionID}\r\n`);
        return;
    }

    if (Buffer.byteLength(groupName, 'utf8') > 61) {
        console.log(`${chalk.red.bold('[ADG]')} ${socket.passport} has attempted to create a group with a name that is too long.`);
        socket.write(`229 ${transactionID}\r\n`);
        return;
    }

    let groupNumber = 0;

    for (const key in groups) {
        groupNumber++;
    }

    groupNumber++;

    groups[uuidv4()] = groupName;

    await connection.query('UPDATE users SET `groups` = ? WHERE id = ?', [JSON.stringify(groups), decoded.id]);

    console.log(`${chalk.green.bold('[ADG]')} ${socket.passport} has created a group named ${groupName}.`);
    socket.write(`ADG ${transactionID} 1 ${groupName} ${groupNumber} 0\r\n`);
}