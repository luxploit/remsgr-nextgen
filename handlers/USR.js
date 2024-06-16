const crypto = require('crypto');
const chalk = require('chalk');
const { MD5Auth, TWNAuth } = require('../utils/auth.util');

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const scheme = args[1];
    const state = args[2];

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    if (scheme === 'SSO') {
        if (state === 'I') {
            socket.passport = args[3];
            console.log(`${chalk.yellow.bold('[USR SSO INITIAL]')} ${socket.passport} is trying to log in.`);
            
            const random = crypto.randomBytes(48).toString('hex');
            const userCommand = `USR ${transactionID} SSO S MBI_KEY_OLD ${random.toString("base64")}\r\n`;
            
            let bytes = "3c 50 6f 6c 69 63 69 65 73 3e 0a 09 3c 50 6f 6c 69 63 79 20 74 79 70 65 3d 22 53 48 49 45 4c 44 53 22 20 63 68 65 63 6b 73 75 6d 3d 22 44 39 37 30 35 41 37 31 42 41 38 34 31 43 42 33 38 39 35 35 38 32 32 45 30 34 38 39 37 30 43 33 22 3e 3c 63 6f 6e 66 69 67 3e 20 3c 73 68 69 65 6c 64 3e 3c 63 6c 69 20 6d 61 6a 3d 22 37 22 20 6d 69 6e 3d 22 30 22 20 6d 69 6e 62 6c 64 3d 22 30 22 20 6d 61 78 62 6c 64 3d 22 39 39 39 39 22 20 64 65 6e 79 3d 22 61 75 64 69 6f 20 63 61 6d 65 72 61 20 70 68 6f 6e 65 22 20 2f 3e 3c 2f 73 68 69 65 6c 64 3e 20 3c 62 6c 6f 63 6b 3e 3c 2f 62 6c 6f 63 6b 3e 3c 2f 63 6f 6e 66 69 67 3e 3c 2f 50 6f 6c 69 63 79 3e 0a 09 3c 50 6f 6c 69 63 79 20 74 79 70 65 3d 22 41 42 43 48 22 20 63 68 65 63 6b 73 75 6d 3d 22 30 33 44 43 35 35 39 31 30 41 39 43 42 37 39 31 33 33 46 31 35 37 36 32 32 31 41 38 30 33 34 36 22 3e 3c 70 6f 6c 69 63 79 3e 3c 73 65 74 20 69 64 3d 22 70 75 73 68 22 20 73 65 72 76 69 63 65 3d 22 41 42 43 48 22 20 70 72 69 6f 72 69 74 79 3d 22 32 30 30 22 3e 20 20 20 20 20 20 3c 72 20 69 64 3d 22 70 75 73 68 73 74 6f 72 61 67 65 22 20 74 68 72 65 73 68 6f 6c 64 3d 22 31 38 30 30 30 30 22 20 2f 3e 20 20 20 20 3c 2f 73 65 74 3e 3c 73 65 74 20 69 64 3d 22 64 65 6c 61 79 73 75 70 22 20 73 65 72 76 69 63 65 3d 22 41 42 43 48 22 20 70 72 69 6f 72 69 74 79 3d 22 31 35 30 22 3e 20 20 3c 72 20 69 64 3d 22 77 68 61 74 73 6e 65 77 22 20 74 68 72 65 73 68 6f 6c 64 3d 22 31 38 30 30 30 30 30 22 20 2f 3e 20 20 3c 72 20 69 64 3d 22 77 68 61 74 73 6e 65 77 5f 73 74 6f 72 61 67 65 5f 41 42 43 48 5f 64 65 6c 61 79 22 20 74 69 6d 65 72 3d 22 31 38 30 30 30 30 30 22 20 2f 3e 20 20 3c 72 20 69 64 3d 22 77 68 61 74 73 6e 65 77 74 5f 6c 69 6e 6b 22 20 74 68 72 65 73 68 6f 6c 64 3d 22 39 30 30 30 30 30 22 20 74 72 69 67 67 65 72 3d 22 51 75 65 72 79 41 63 74 69 76 69 74 69 65 73 22 20 2f 3e 3c 2f 73 65 74 3e 20 20 3c 63 20 69 64 3d 22 50 52 4f 46 49 4c 45 5f 52 61 6d 70 75 70 22 3e 31 30 30 3c 2f 63 3e 3c 2f 70 6f 6c 69 63 79 3e 3c 2f 50 6f 6c 69 63 79 3e 0a 09 3c 50 6f 6c 69 63 79 20 74 79 70 65 3d 22 45 52 52 4f 52 52 45 53 50 4f 4e 53 45 54 41 42 4c 45 22 20 63 68 65 63 6b 73 75 6d 3d 22 36 31 32 37 45 45 44 43 45 38 36 30 46 34 35 43 31 36 39 32 38 39 36 46 35 32 34 38 41 46 36 46 22 3e 3c 50 6f 6c 69 63 79 3e 20 3c 46 65 61 74 75 72 65 20 74 79 70 65 3d 22 33 22 20 6e 61 6d 65 3d 22 50 32 50 22 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 31 30 30 30 33 39 38 22 20 61 63 74 69 6f 6e 3d 22 33 22 2f 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 32 30 30 30 30 32 30 22 20 61 63 74 69 6f 6e 3d 22 33 22 2f 3e 20 3c 2f 46 65 61 74 75 72 65 3e 20 3c 46 65 61 74 75 72 65 20 74 79 70 65 3d 22 34 22 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 31 30 30 30 34 34 30 22 20 2f 3e 20 3c 2f 46 65 61 74 75 72 65 3e 20 3c 46 65 61 74 75 72 65 20 74 79 70 65 3d 22 36 22 20 6e 61 6d 65 3d 22 54 55 52 4e 22 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 30 30 37 32 37 34 43 22 20 61 63 74 69 6f 6e 3d 22 33 22 20 2f 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 32 30 30 30 30 32 30 22 20 61 63 74 69 6f 6e 3d 22 33 22 20 2f 3e 20 20 3c 45 6e 74 72 79 20 68 72 3d 22 30 78 38 30 30 37 32 37 34 41 22 20 61 63 74 69 6f 6e 3d 22 33 22 20 2f 3e 20 3c 2f 46 65 61 74 75 72 65 3e 3c 2f 50 6f 6c 69 63 79 3e 3c 2f 50 6f 6c 69 63 79 3e 0a 09 3c 50 6f 6c 69 63 79 20 74 79 70 65 3d 22 50 32 50 22 20 63 68 65 63 6b 73 75 6d 3d 22 38 31 35 44 34 46 31 46 46 38 45 33 39 41 38 35 46 31 46 39 37 43 34 42 31 36 43 34 35 31 37 37 22 3e 3c 4f 62 6a 53 74 72 20 53 6e 64 44 6c 79 3d 22 31 22 20 2f 3e 3c 2f 50 6f 6c 69 63 79 3e 0a 3c 2f 50 6f 6c 69 63 69 65 73 3e";
            
            const buffer = Buffer.from(bytes.replace(/\s/g, ""), "hex").toString().replace(/\n/g, "\r\n");
            socket.write("GCF 0 1209\r\n" + buffer);
            socket.write(userCommand);
        } else if (state === 'S') {
            console.log(`${chalk.yellow.bold('[USR SSO SUBSEQUENT]')} ${socket.passport} has successfully logged in.`);
            socket.write(`USR ${transactionID} OK ${socket.passport} 1 0\r\n`);
            socket.write(`SBS 0 null\r\n`);
            socket.write(`MSG Hotmail Hotmail 1460\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsprofile; charset=UTF-8\r\nLoginTime: 1706902514\r\nEmailEnabled: 0\r\nMemberIdHigh: 3061839339\r\nMemberIdLow: 496352507\r\nlang_preference: 1033\r\npreferredEmail:\r\ncountry:\r\nPostalCode:\r\nGender:\r\nKid: 0\r\nAge:\r\nBDayPre:\r\nBirthday:\r\nWallet:\r\nFlags: 536872513\r\nsid: 507\r\nMSPAuth: fergalicious\r\nClientIP: ${socket.remoteAddress}\r\nClientPort: ${socket.remotePort}\r\nABCHMigrated: 1\r\n`);
            // setTimeout(() => {
            //     socket.write(`UBX 1:${socket.passport} 0\r\n`)
            // }, 50)
        }
    }

    else if (scheme === 'TWN') {
        if (state === 'I') {
            socket.passport = args[3];
            TWNAuth.login(socket, socket.version, state, transactionID, socket.passport);
        }
        
        else if (state === 'S') {
            TWNAuth.login(socket, socket.version, state, transactionID, socket.passport, args[3]);
        }
    }

    else if (scheme === 'SHA') {
        socket.write(`USR ${transactionID} OK ${socket.passport} 0 0\r\n`);
    }

    else if (scheme === 'MD5') {
        if (state === 'I') {
            socket.passport = args[3];
            MD5Auth.login(socket, socket.version, state, transactionID, socket.passport);
        }
        
        else if (state === 'S') {
            MD5Auth.login(socket, socket.version, state, transactionID, socket.passport, args[3]);
        }
    }

    else {
        socket.destroy();
    }
}