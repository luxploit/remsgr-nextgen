const supportedVersions = require('../data/versions');
const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const versions = args.slice(1);

    const supported = versions.filter(version => supportedVersions.includes(version));

    if (supported.length > 0) {
        console.log(`${chalk.red.bold('[VER]')} ${socket.remoteAddress} has sent supported versions, these are: ${supported.join(', ')}.`);
        socket.write(`VER ${transactionID} ${supported.join(' ')}\r\n`);
    } else {
        console.log(`${chalk.red.bold('[VER]')} ${socket.remoteAddress} has sent unsupported versions.`);
        socket.write(`VER ${transactionID} 0\r\n`);
    }
}