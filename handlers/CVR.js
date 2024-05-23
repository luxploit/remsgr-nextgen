module.exports = (socket, args) => {
    const transactionID = args[0];
    const version = args[6];

    socket.write(`CVR ${transactionID} ${version} ${version} ${version} https://youtu.be/phuiiNCxRMg https://youtu.be/phuiiNCxRMg\r\n`);
}