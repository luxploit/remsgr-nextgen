const jwt = require('jsonwebtoken');
const { parse: uuidParse } = require('uuid');
const chalk = require('chalk');
const { getMultipleSocketsByPassport, getSocketByUserID } = require('./socket.util');

const User = require('../models/User');
const Contact = require('../models/Contact');

class MD5Auth {
    static algorithm = 'md5';
    static separator = '$';

    async login(socket, version, state, transactionID, passport, passhash) {
        if (state === 'I') {
            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} is trying to log in.`);

            const user = await User.findOne({ email: passport });

            if (!user) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = user.legacy_pass;

            if (!legacyPass) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} has no legacy password.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const md5Hash = this.extractMD5Hash(legacyPass);

            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} Returned MD5 hash to ${passport}`);
            socket.write(`USR ${transactionID} MD5 S ${md5Hash}\r\n`);
        } else if (state === 'S') {
            const user = await User.findOne({ email: passport });

            if (!user) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} does not exist in the database.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = user.legacy_pass;

            if (!legacyPass) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has no legacy password.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const md5Password = this.extractMD5Password(legacyPass);

            if (passhash !== md5Password) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has entered an incorrect password.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const existingSockets = getMultipleSocketsByPassport(passport);

            existingSockets.forEach(existingSocketObj => {
                if (existingSocketObj !== socket) {
                    console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} is already logged in, logging out old session.`);
                    existingSocketObj.write('OUT\r\n');
                    existingSocketObj.destroy();
                }
            });

            const token = jwt.sign({ id: user._id, uuid: user.uuid }, process.env.JWT_SECRET, { expiresIn: '1d' });
            socket.token = token;
            socket.userID = user._id.toString();
            socket.friendly_name = user.friendly_name;

            user.last_login = new Date();
            await user.save();

            console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has successfully logged in.`);
            socket.write(`USR ${transactionID} OK ${passport} ${user.friendly_name} 1\r\n`);

            if (version >= 7) {
                const timestamp = Math.floor(Date.now() / 1000);
                const [high, low] = uuidToHighLow(user.uuid);
                const ip = socket.remoteAddress.replace('::ffff:', '');
                const port = socket.remotePort;

                const messageTemplate = `MIME-Version: 1.0\r\nContent-Type: text/x-msmsgsprofile; charset=UTF-8\r\nLoginTime: ${timestamp}\r\nEmailEnabled: 0\r\nMemberIdHigh: ${high}\r\nMemberIdLow: ${low}\r\nlang_preference: 0\r\npreferredEmail: \r\ncountry: \r\nPostalCode: \r\nGender: \r\nKid: 0\r\nAge: \r\nBDayPre: \r\nBirthday: \r\nWallet: \r\nFlags: 536872513\r\nsid: 507\r\nMSPAuth: ${token}\r\nClientIP: ${ip}\r\nClientPort: ${port}\r\nABCHMigrated: 1\r\nMPOPEnabled: 0\r\n\r\n`;

                const newLineCount = (messageTemplate.match(/\r\n/g) || []).length;
                const initialHeader = `MSG Hotmail Hotmail `;
                const lengthWithoutPlaceholder = initialHeader.length + messageTemplate.length - newLineCount;

                const messageLength = lengthWithoutPlaceholder + String(lengthWithoutPlaceholder).length + 1;
                const messageHeader = `MSG Hotmail Hotmail ${messageLength}\r\n`;

                const finalMessage = messageHeader + messageTemplate;

                socket.write(finalMessage);
            }
        }
    }

    extractMD5Hash(legacyPass) {
        const parts = legacyPass.split('$');
        if (parts.length < 2 || parts[0] !== 'md5') {
            throw new Error('Invalid legacy_pass format');
        }
        return parts[1];
    }

    extractMD5Password(legacyPass) {
        const parts = legacyPass.split('$');
        if (parts.length < 3 || parts[0] !== 'md5') {
            throw new Error('Invalid legacy_pass format');
        }
        return parts[2];
    }
}

class TWNAuth {
    async login(socket, version, state, transactionID, passport, token) {
        if (state === 'I') {
            console.log(`${chalk.yellow.bold('[USR TWN INITIAL]')} ${passport} is trying to log in.`);
            socket.write(`USR ${transactionID} TWN S ct=1,rver=1,wp=FS_40SEC_0_COMPACT,lc=1,id=1\r\n`);
        } else if (state === 'S') {
            const decoded = await verifyJWT(token);

            if (!decoded) {
                console.log(`${chalk.yellow.bold('[USR TWN SUBSEQUENT]')} ${passport} has an invalid token.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const user = await User.findOne({ email: passport });

            if (!user) {
                console.log(`${chalk.yellow.bold('[USR TWN SUBSEQUENT]')} ${passport} does not exist in the database.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const existingSockets = getMultipleSocketsByPassport(passport);

            existingSockets.forEach(existingSocketObj => {
                if (existingSocketObj !== socket) {
                    console.log(`${chalk.yellow.bold('[USR TWN SUBSEQUENT]')} ${passport} is already logged in, logging out old session.`);
                    existingSocketObj.write('OUT\r\n');
                    existingSocketObj.destroy();
                }
            });

            socket.token = token;
            socket.userID = user._id.toString();
            socket.friendly_name = user.friendly_name;

            user.last_login = new Date();
            await user.save();

            console.log(`${chalk.yellow.bold('[USR TWN SUBSEQUENT]')} ${passport} has successfully logged in.`);
            if (version >= 10) {
                socket.write(`USR ${transactionID} OK ${passport} 1 0\r\n`);

                const timestamp = Math.floor(Date.now() / 1000);
                const [high, low] = uuidToHighLow(user.uuid);
                const ip = socket.remoteAddress.replace('::ffff:', '');
                const port = socket.remotePort;

                const messageTemplate = `MIME-Version: 1.0\r\nContent-Type: text/x-msmsgsprofile; charset=UTF-8\r\nLoginTime: ${timestamp}\r\nEmailEnabled: 0\r\nMemberIdHigh: ${high}\r\nMemberIdLow: ${low}\r\nlang_preference: 0\r\npreferredEmail: \r\ncountry: \r\nPostalCode: \r\nGender: \r\nKid: 0\r\nAge: \r\nBDayPre: \r\nBirthday: \r\nWallet: \r\nFlags: 536872513\r\nsid: 507\r\nMSPAuth: ${token}\r\nClientIP: ${ip}\r\nClientPort: ${port}\r\nABCHMigrated: 1\r\nMPOPEnabled: 0\r\n\r\n`;

                const newLineCount = (messageTemplate.match(/\r\n/g) || []).length;
                const initialHeader = `MSG Hotmail Hotmail `;
                const lengthWithoutPlaceholder = initialHeader.length + messageTemplate.length - newLineCount;

                const messageLength = lengthWithoutPlaceholder + String(lengthWithoutPlaceholder).length + 1;
                const messageHeader = `MSG Hotmail Hotmail ${messageLength}\r\n`;

                const finalMessage = messageHeader + messageTemplate;

                socket.write(finalMessage);
            } else {
                socket.write(`USR ${transactionID} OK ${passport} ${socket.friendly_name} 1 0\r\n`);

                const timestamp = Math.floor(Date.now() / 1000);
                const [high, low] = uuidToHighLow(user.uuid);
                const ip = socket.remoteAddress.replace('::ffff:', '');
                const port = socket.remotePort;

                const messageTemplate = `MIME-Version: 1.0\r\nContent-Type: text/x-msmsgsprofile; charset=UTF-8\r\nLoginTime: ${timestamp}\r\nEmailEnabled: 0\r\nMemberIdHigh: ${high}\r\nMemberIdLow: ${low}\r\nlang_preference: 0\r\npreferredEmail: \r\ncountry: \r\nPostalCode: \r\nGender: \r\nKid: 0\r\nAge: \r\nBDayPre: \r\nBirthday: \r\nWallet: \r\nFlags: 536872513\r\nsid: 507\r\nMSPAuth: ${token}\r\nClientIP: ${ip}\r\nClientPort: ${port}\r\nABCHMigrated: 1\r\nMPOPEnabled: 0\r\n\r\n`;

                const newLineCount = (messageTemplate.match(/\r\n/g) || []).length;
                const initialHeader = `MSG Hotmail Hotmail `;
                const lengthWithoutPlaceholder = initialHeader.length + messageTemplate.length - newLineCount;

                const messageLength = lengthWithoutPlaceholder + String(lengthWithoutPlaceholder).length + 1;
                const messageHeader = `MSG Hotmail Hotmail ${messageLength}\r\n`;

                const finalMessage = messageHeader + messageTemplate;

                socket.write(finalMessage);
            }
        }
    }
}

function uuidToHighLow(uuid) {
    const parsedUuid = uuidParse(uuid);
    const high = (parsedUuid[0] << 24) | (parsedUuid[1] << 16) | (parsedUuid[2] << 8) | parsedUuid[3];
    const low = (parsedUuid[10] << 24) | (parsedUuid[11] << 16) | (parsedUuid[12] << 8) | parsedUuid[13];
    return [high >>> 0, low >>> 0]; // >>> 0 to convert to unsigned 32-bit integer
}

async function verifyJWT(token) {
    if (!token) {
        console.log(`${chalk.red.bold('[JWT DECODE]')} No token provided.`);
        return false;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    } catch (err) {
        console.log(`${chalk.red.bold('[JWT DECODE]')} Token decoding failed.`);
        return false;
    }
}

async function logOut(socket) {
    if (!socket.userID || !socket.token || !socket.passport) {
        socket.write(`OUT\r\n`);
        socket.destroy();
        return;
    }

    try {
        const contacts = await Contact.find({ userID: socket.userID, list: 'FL' });

        for (const contact of contacts) {
            const contactID = contact.contactID.toString();
            const contactSocket = getSocketByUserID(contactID);

            if (!contactSocket) {
                continue;
            }

            const contactContacts = await Contact.find({ userID: contact.contactID, contactID: socket.userID, list: 'FL' });

            if (contactContacts.length > 0) {
                contactSocket.write(`FLN ${socket.passport}\r\n`);
            }
        }
    } catch (err) {
        console.log(`${chalk.red.bold('[LOGOUT UTIL]')} ${socket.passport} failed to get contacts from the database.`);
    } finally {
        socket.destroy();
    }
}

module.exports = {
    MD5Auth: new MD5Auth(),
    TWNAuth: new TWNAuth(),
    verifyJWT,
    logOut
};
