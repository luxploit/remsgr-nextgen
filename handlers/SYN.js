const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const IDplusone = parseInt(args[1]) + 1;

    console.log(`${chalk.magentaBright.bold('[SYN]')} ${socket.passport} sister wants CONTACT LIST 💜`);
    socket.write(`SYN ${transactionID} ${IDplusone}\r\n`);
    socket.write(`GTC ${transactionID} ${IDplusone} A\r\n`);
    socket.write(`BLP ${transactionID} ${IDplusone} AL\r\n`);

    if (socket.version >= 7) {
        socket.write(`LSG ${transactionID} ${IDplusone} 1 2 0 Other%20Contacts 0\r\n`);
        socket.write(`LSG ${transactionID} ${IDplusone} 2 2 1 Favorites 0\r\n`);
    }

    socket.write(`LST ${transactionID} FL ${IDplusone} 1 1 default@butterfly.net default 0\r\n`);
    socket.write(`LST ${transactionID} AL ${IDplusone} 1 1 default@butterfly.net default\r\n`);
    socket.write(`LST ${transactionID} BL ${IDplusone} 0 0\r\n`);
    socket.write(`LST ${transactionID} RL ${IDplusone} 1 1 default@butterfly.net default\r\n`);
}