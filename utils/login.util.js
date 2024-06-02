const chalk = require('chalk');
const connection = require('../db/connect').promise();
const { sockets, getSocketByPassport, getMultipleSocketsByPassport } = require('../utils/socket.util');

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
            const [rows] = await connection.query('SELECT legacy_pass FROM users WHERE email = ?', [passport]);

            if (rows.length === 0) {
                console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} does not exist in the database.`);
                socket.write(`911 4\r\n`);
                socket.destroy();
                return;
            }

            const legacyPass = rows[0].legacy_pass;

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

            await connection.query('UPDATE users SET last_login = NOW() WHERE email = ?', [passport]);

            console.log(`${chalk.yellow.bold('[USR MD5 SUBSEQUENT]')} ${passport} has successfully logged in.`);
            socket.write(`USR ${transactionID} OK ${passport} ${passport} 1\r\n`);
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

}

module.exports = new LoginMethods();