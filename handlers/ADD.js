const chalk = require('chalk');
const config = require("../config")
const auth = require("../utils/auth.util");
const connection = require('../db/connect').promise();
const validator = require('email-validator');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const list = args[1];
    const email = args[2];

    const decoded = await auth.verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    if (email === decoded.email) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add themselves to a list. (${email})`);
        socket.write(`201\r\n`);
        return;
    }

    if (!validator.validate(email)) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user with an invalid email address. (${email})`);
        socket.write(`201\r\n`);
        return;
    }

    const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [email]);

    if (rows.length === 0) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that does not exist. (${email})`);
        socket.write(`205\r\n`);
        return;
    }

    const [contacts] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND list = ?', [decoded.id, list]);

    if (contacts.length >= 300) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to a list that is full. (${email})`);
        socket.write(`210\r\n`);
        return;
    }

    const [existing] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ?', [decoded.id, rows[0].id]);

    if (existing.length > 0) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is already in their list. (${email})`);
        socket.write(`215\r\n`);
        return;
    }

    const [blocked] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [decoded.id, rows[0].id, 'BL']);
    const [allowed] = await connection.query('SELECT * FROM contacts WHERE userID = ? AND contactID = ? AND list = ?', [decoded.id, rows[0].id, 'AL']);

    if (blocked.length > 0 && allowed.length > 0) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is blocked. (${email})`);
        socket.write(`215\r\n`);
        return;
    }

    await connection.query('INSERT INTO contacts (userID, contactID, list) VALUES (?, ?, ?)', [decoded.id, rows[0].id, list]);
    const friendly_name = encodeURIComponent(rows[0].friendly_name);

    console.log(`${chalk.green.bold('[ADD]')} ${socket.passport} has added ${email} to their ${list} list.`);
    socket.write(`ADD ${transactionID} ${list} 1 ${email} ${friendly_name} 0\r\n`);
}