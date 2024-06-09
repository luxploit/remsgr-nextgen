const chalk = require('chalk');
const connection = require('../db/connect').promise();
const jwt = require('jsonwebtoken');
const { parse: uuidParse } = require('uuid');
const { sockets, getSocketByPassport, getMultipleSocketsByPassport } = require('./socket.util');

class MD5Auth {
    static algorithm = 'md5';
    static separator = '$';

    async login(socket, version, state, transactionID, passport, passhash) {
        if (state === 'I') {
            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} is trying to log in.`);

            const [rows] = await connection.query('SELECT legacy_pass FROM users WHERE email = ?', [passport]);

            if (rows.length === 0) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = rows[0].legacy_pass;

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
            const [rows] = await connection.query('SELECT * FROM users WHERE email = ?', [passport]);

            if (rows.length === 0) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} does not exist in the database.`);
                socket.write(`911 ${transactionID}\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = rows[0].legacy_pass;
            const friendly_name = encodeURIComponent(rows[0].friendly_name);

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

            const token = jwt.sign({ id: rows[0].id, uuid: rows[0].uuid, email: rows[0].email }, process.env.JWT_SECRET, { expiresIn: '1d' });
            socket.token = token;

            await connection.query('UPDATE users SET last_login = NOW() WHERE email = ?', [passport]);

            console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has successfully logged in.`);
            socket.write(`USR ${transactionID} OK ${passport} ${friendly_name} 1\r\n`);

            if (version >= 7) {
                const timestamp = Math.floor(Date.now() / 1000);
                const [high, low] = this.uuidToHighLow(rows[0].uuid);
                const ip = socket.remoteAddress.replace('::ffff:', '');
                const port = socket.remotePort;

                socket.write(`MSG Hotmail Hotmail 589\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsprofile; charset=UTF-8\r\nLoginTime: ${timestamp}\r\nEmailEnabled: 0\r\nMemberIdHigh: ${high}\r\nMemberIdLow: ${low}\r\nlang_preference: 0\r\npreferredEmail: \r\ncountry: \r\nPostalCode: \r\nGender: \r\nKid: 0\r\nAge: \r\nBDayPre: \r\nBirthday: \r\nWallet: \r\nFlags: 536872513\r\nsid: 507\r\nMSPAuth: ${token}\r\nClientIP: ${ip}\r\nClientPort: ${port}\r\nABCHMigrated: 1\r\nMPOPEnabled: 0\r\n\r\n`);
            }
        }
    }

    uuidToHighLow(uuid) {
        const parsedUuid = uuidParse(uuid);
        const high = (parsedUuid[0] << 24) | (parsedUuid[1] << 16) | (parsedUuid[2] << 8) | parsedUuid[3];
        const low = (parsedUuid[10] << 24) | (parsedUuid[11] << 16) | (parsedUuid[12] << 8) | parsedUuid[13];
        return [high >>> 0, low >>> 0]; // >>> 0 to convert to unsigned 32-bit integer
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

async function verifyJWT(token) {
    if (!token) {
        console.log(`${chalk.red.bold('[JWT DECODE]')} No token provided.`);
        return false;
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log(`${chalk.red.bold('[JWT DECODE]')} Token decoded for user ID ${decoded.id}.`);
        return decoded;
    } catch (err) {
        console.log(`${chalk.red.bold('[JWT DECODE]')} Token decoding failed.`);
        return false;
    }
}

module.exports = {
    MD5Auth: new MD5Auth(),
    verifyJWT
};
