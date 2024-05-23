const supportedVersions = require('../data/versions');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const versions = args.slice(1);

    const supported = versions.filter(version => supportedVersions.includes(version));

    if (supported.length > 0) {
        socket.write(`VER ${transactionID} ${supported.join(' ')}\r\n`);
    } else {
        socket.write(`VER ${transactionID} NONE\r\n`);
    }

    console.log('RETURNED VER')
}