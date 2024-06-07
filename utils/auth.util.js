const chalk = require('chalk');
const connection = require('../db/connect').promise();
const jwt = require('jsonwebtoken');
const { sockets, getSocketByPassport, getMultipleSocketsByPassport } = require('./socket.util');

class LoginMethods {

    // MD5 AUTHENTICATION

    async md5login(socket, version, state, transactionID, passport, passhash) {
        if (state === 'I') {
            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} is trying to log in.`);

            const [rows] = await connection.query('SELECT legacy_pass FROM users WHERE email = ?', [passport]);

            if (rows.length === 0) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} does not exist in the database.`);
                socket.write(`911 4\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = rows[0].legacy_pass;

            if (!legacyPass) {
                console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} ${passport} has no legacy password.`);
                socket.write(`911 4\r\n`);
                socket.destroy();
                return;
            }

            const md5Hash = this.extractMD5Hash(legacyPass);
    
            console.log(`${chalk.yellow.bold('[USR MD5 INITIAL]')} Returned MD5 hash to ${passport}`);
            socket.write(`USR ${transactionID} MD5 S ${md5Hash}\r\n`);
        }

        else if (state === 'S') {
            const [rows] = await connection.query('SELECT id, uuid, email, friendly_name, legacy_pass FROM users WHERE email = ?', [passport]);

            if (rows.length === 0) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} does not exist in the database.`);
                socket.write(`911 4\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = rows[0].legacy_pass;
            const friendly_name = encodeURIComponent(rows[0].friendly_name);

            if (!legacyPass) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has no legacy password.`);
                socket.write(`911 4\r\n`);
                socket.destroy();
                return;
            }

            const md5Password = this.extractMD5Password(legacyPass);

            if (passhash !== md5Password) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has entered an incorrect password.`);
                socket.write(`911 4\r\n`);
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

            if (socket.version === 7) {
                
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

    // SSO AUTHENTICATION - NOT IMPLEMENTED YET

    // VERIFICATIONS

    async verifyJWT(token) {
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

}

module.exports = new LoginMethods();