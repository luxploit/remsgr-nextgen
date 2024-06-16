const supportedVersions = require('../data/versions');
const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const versions = args.slice(1);

    if (isNaN(transactionID)) {
        socket.destroy();
        return;
    }

    const supported = versions.filter(version => supportedVersions.includes(version));

    if (supported.length > 0) {
        const version = parseInt(supported[0].replace('MSNP', ''));
        console.log(`${chalk.red.bold('[VER]')} ${socket.remoteAddress} has sent supported versions, these are: ${supported.join(', ')}, we will use MSNP${version}.`);
        socket.version = version;
        socket.write(`VER ${transactionID} MSNP${version}\r\n`);
    } else {
        console.log(`${chalk.red.bold('[VER]')} ${socket.remoteAddress} has sent unsupported versions.`);
        socket.write(`VER ${transactionID} 0\r\n`);
        socket.destroy();
    }
}