const chalk = require('chalk');
const { verifyJWT } = require("../utils/auth.util");

const User = require('../models/User');

module.exports = async (socket, args, command) => {
    const transactionID = args[0];

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

    if (socket.version >= 10) {
        try {
            let groupUUID = args[1];
            const newName = args[2];
            const user = await User.findOne({ _id: decoded.id }).exec();

            if (!user || !user.groups) {
                console.log(`${chalk.red.bold('[REG]')} User not found or no groups available.`);
                socket.write(`205 ${transactionID}\r\n`);
                return;
            }
            
            if (groupUUID === 'New%20Group' || groupUUID === 'New%2520Group') {
                const newGroup = user.groups.find(g => g.name === 'New%20Group');
                if (newGroup) {
                    groupUUID = newGroup.id;
                } else {
                    console.log(`${chalk.red.bold('[RMG]')} 'New Group' not found.`);
                    socket.write(`205 ${transactionID}\r\n`);
                    return;
                }
            }

            const groupWithSameName = user.groups.find(g => g.name === newName);

            if (groupWithSameName && groupWithSameName.id !== groupUUID) {
                console.log(`${chalk.red.bold('[REG]')} ${socket.passport} has attempted to rename a group to a name that already exists. (${newName})`);
                socket.write(`205 ${transactionID}\r\n`);
                return;
            }

            const group = user.groups.find(g => g.id === groupUUID);

            if (!group) {
                console.log(`${chalk.red.bold('[REG]')} ${socket.passport} has attempted to rename a group that does not exist. (${groupUUID})`);
                socket.write(`205 ${transactionID}\r\n`);
                return;
            }

            group.name = newName;
            user.markModified('groups');

            await user.save();

            socket.write(`${command}\r\n`);
        } catch (error) {
            console.error(`${chalk.red.bold('[ERROR]')} Failed to rename group:`, error);
            socket.write(`500 ${transactionID}\r\n`);
        }
    }

};
