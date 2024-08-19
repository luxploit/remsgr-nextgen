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

    if (emailArg.startsWith('C=') && list === 'FL') {
        // add to group
        const contactUUID = emailArg.replace('C=', '');
        const contact = await User.findOne({ uuid: contactUUID }).exec();
    
        if (!contact) {
            console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user that does not exist. (${contactUUID})`);
            socket.write(`205 ${transactionID}\r\n`);
            return;
        }
    
        const groupUUID = args[3];
    
        const myself = await User.findOne({ _id: decoded.id }).exec();
        const group = myself.groups.find(g => g.id === groupUUID); // Changed 'uuid' to 'id'
    
        if (!group) {
            console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to a group that does not exist. (${groupUUID})`);
            socket.write(`205 ${transactionID}\r\n`);
            return;
        }
    
        const userIsInFL = await Contact.findOne({ userID: decoded.id, contactID: contact._id, list: 'FL' }).exec();
    
        if (userIsInFL) {
            userIsInFL.groups.push(groupUUID);
            await userIsInFL.save();
        } else {
            console.log(`${chalk.red.bold('[ADD]')} ${socket.passport} has attempted to add a user to a group that is not in their FL list. (${groupUUID})`);
            socket.write(`205 ${transactionID}\r\n`);
            return;
        }
    
        socket.write(`ADC ${transactionID} FL C=${contactUUID} ${groupUUID}\r\n`);
    
        console.log(`${chalk.green.bold('[ADD]')} ${socket.passport} has added ${email} to their FL list in group ${groupUUID}.`);
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
        socket.write(`ADC ${transactionID} FL N=${email} F=${user.friendly_name} C=${user.uuid}\r\n`);
    } else if (list === 'AL' || list === 'BL' || list === 'RL') {
        socket.write(`ADC ${transactionID} ${list} N=${email}\r\n`);
    }

    const contactSocket = getSocketByUserID(user._id.toString());

    // i'm not even sure what the fuck im trying to do here honestly
//    if (contactSocket) {
//        const contactBlocked = await Contact.findOne({ userID: user._id, contactID: decoded.id, list: 'BL' }).exec();
//        const contactAllowed = await Contact.findOne({ userID: user._id, contactID: decoded.id, list: 'AL' }).exec();
//        const contactForward = await Contact.findOne({ userID: user._id, contactID: decoded.id, list: 'FL' }).exec();
//
//        if (!contactBlocked && contactAllowed) {
//            socket.write(`NLN ${contactSocket.status} ${contactSocket.passport} ${contactSocket.friendly_name}\r\n`);
//        }
//
//        if (!contactForward && list === 'FL') {
//            contactSocket.write(`ADC ${transactionID} FL N=${socket.passport} F=${socket.friendly_name} C=${decoded.uuid}\r\n`);
//        }
//    }

    console.log(`${chalk.green.bold('[ADD]')} ${socket.passport} has added ${email} to their ${list} list.`);
};
