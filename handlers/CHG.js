const chalk = require('chalk');

module.exports = (socket, args) => {
    const transactionID = args[0];
    const status = args[1];

    console.log(`${chalk.blue.bold('[CHG]')} ${socket.passport} GIORLLL SHES CHANGING HER STATUS AND ASKING FOR STATUSES HELPPPP`);
    socket.write(`CHG ${transactionID} ${status}\r\n`);
    socket.write(`ILN ${transactionID} IDL chriskermit@escargot.chat chris%20faggot%20jane\r\n`);
}