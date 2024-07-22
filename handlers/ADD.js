const chalk = require('chalk');
const config = require("../config");
const { verifyJWT } = require("../utils/auth.util");
const validator = require('email-validator');
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const User = require('../models/User');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const list = args[1];
    const email = args[2];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const decoded = await verifyJWT(socket.token);

    if (!decoded) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.remoteAddress} has an invalid token.`);
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    if (!validator.validate(email)) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user with an invalid email address. (${email})`);
        socket.write(`201 ${transactionID}\r\n`);
        return;
    }

    const user = await User.findOne({ email }).exec();

    if (!user) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that does not exist. (${email})`);
        socket.write(`205 ${transactionID}\r\n`);
        return;
    }

    const contacts = await Contact.find({ userID: decoded.id, list }).exec();

    if (contacts.length >= 150) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to a list that is full. (${email})`);
        socket.write(`210 ${transactionID}\r\n`);
        return;
    }

    const existing = await Contact.findOne({ userID: decoded.id, contactID: user._id, list }).exec();

    if (existing) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is already in their ${list} list. (${email})`);
        socket.write(`215 ${transactionID}\r\n`);
        return;
    }

    const blocked = await Contact.findOne({ userID: decoded.id, contactID: user._id, list: 'BL' }).exec();
    const allowed = await Contact.findOne({ userID: decoded.id, contactID: user._id, list: 'AL' }).exec();

    if (blocked && allowed) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is blocked. (${email})`);
        socket.write(`215 ${transactionID}\r\n`);
        return;
    }

    const newContact = new Contact({
        userID: decoded.id,
        contactID: user._id,
        list
    });
    
    await newContact.save();

    const friendly_name = user.friendly_name;

    console.log(`${chalk.green.bold('[ADD]')} ${socket.passport} has added ${email} to their ${list} list.`);
    socket.write(`ADD ${transactionID} ${list} 1 ${email} ${friendly_name} 0\r\n`);
}
