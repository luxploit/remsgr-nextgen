const chalk = require('chalk');
const config = require("../config");
const { verifyJWT } = require("../utils/auth.util");
const { getSocketByUserID } = require("../utils/socket.util");
const mongoose = require('mongoose');
const Contact = require('../models/Contact');
const User = require('../models/User');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const list = args[1];
    const emailArg = args[2];
    const email = emailArg.replace('N=', '');
    const username = email.split('@')[0];

    // Check if the transaction ID is a number
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

    const user = await User.findOne({ username }).exec();

    if (!user) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that does not exist. (${username})`);
        socket.write(`205 ${transactionID}\r\n`);
        return;
    }

    const contacts = await Contact.find({ userID: decoded.id, list: "FL" }).exec();

    if (contacts.length >= 150 && list === "FL") {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to a list that is full. (${username})`);
        socket.write(`210 ${transactionID}\r\n`);
        return;
    }

    const existing = await Contact.findOne({ userID: decoded.id, contactID: user._id, list }).exec();

    if (existing) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is already in their ${list} list. (${username})`);
        socket.write(`215 ${transactionID}\r\n`);
        return;
    }

    const blocked = await Contact.findOne({ userID: decoded.id, contactID: user._id, list: 'BL' }).exec();
    const allowed = await Contact.findOne({ userID: decoded.id, contactID: user._id, list: 'AL' }).exec();

    if (blocked && allowed) {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that is blocked. (${username})`);
        socket.write(`215 ${transactionID}\r\n`);
        return;
    }

    if (list === 'PL') {
        console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to the PL list, which is not allowed.`);
        socket.destroy();
        return;
    }

    const newContact = new Contact({
        userID: decoded.id,
        contactID: user._id,
        list
    });
    
    await newContact.save();

    // Use the correct command structure for the list type
    if (list === 'FL') {
        socket.write(`ADC ${transactionID} FL N=${email} F=${user.friendly_name}\r\n`);
    } else if (list === 'AL' || list === 'BL' || list === 'RL') {
        socket.write(`ADC ${transactionID} ${list} N=${email}\r\n`);
    }

    // const contactSocket = getSocketByUserID(user._id.toString());

    // if (contactSocket) {
    //     const contact = await Contact.findOne({ userID: user._id, contactID: decoded.id, list: 'FL' }).exec();
    //     if (contact) {
    //         // TODO
    //     }
    // }

    console.log(`${chalk.green.bold('[ADD]')} ${socket.passport} has added ${email} to their ${list} list.`);
};
