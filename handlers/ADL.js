const chalk = require('chalk');

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const transactionIDplusONE = parseInt(transactionID) + 1;

    socket.write(`ADL ${transactionID} OK\r\n`);
    socket.write(`UUX ${parseInt(transactionID) + 1} 0\r\n`);
    socket.write(`UUX ${parseInt(transactionID) + 2} 0\r\n`);
    socket.write(`BLP ${parseInt(transactionID) + 3} AL\r\n`);
    socket.write(`UUX ${parseInt(transactionID) + 4} 0\r\n`);
    socket.write(`PRP ${parseInt(transactionID) + 5} MFN ${socket.passport}\r\n`);
    socket.write(`CHG ${parseInt(transactionID) + 6} NLN 0\r\n`);
    // socket.write(`USR ${parseInt(transactionID) + 4} OK ${socket.passport} 0 0\r\n`);
    // socket.write(`UUX ${parseInt(transactionID) + 6} 0 \r\n`);
    socket.write(`NLN NLN 1:${socket.passport} ${socket.passport} 0 0\r\n`);
    socket.write(
        `UBX 1:${socket.passport} 482\r\n<Data><PSM></PSM><CurrentMedia></CurrentMedia><MachineGuid>{4F81FB18-2769-45F4-BCB2-B3CA0B6E11C6}</MachineGuid><DDP></DDP><SignatureSound></SignatureSound><Scene></Scene><ColorScheme></ColorScheme><EndpointData id="{4F81FB18-2769-45F4-BCB2-B3CA0B6E11C6}"><Capabilities>0</Capabilities></EndpointData><PrivateEndpointData id="{4F81FB18-2769-45F4-BCB2-B3CA0B6E11C6}"><EpName></EpName><ClientType>1</ClientType><State>NLN</State></PrivateEndpointData></Data>`,
    );
    await delay(1000);
    socket.write(
        `MSG Hotmail Hotmail 195\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsinitialmdatanotification; charset=UTF-8\r\n\r\nMail-Data: <MD><E><I>0</I><IU>0</IU><O>0</O><OU>0</OU></E><Q><QTM>409600</QTM><QNM>204800</QNM></Q></MD>\r\n`,
    );
    socket.write(
    	`MSG Hotmail Hotmail 148\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsactivemailnotification; charset=UTF-8\r\n\r\nSrc-Folder: .!!OIM\r\nDest-Folder: .!!trAsH\r\nMessage-Delta: 1\r\n`,
    );
    // socket.write(
    // 	`MSG Hotmail Hotmail 148\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsactivemailnotification; charset=UTF-8\r\n\r\nSrc-Folder: .!!OIM\r\nDest-Folder: .!!trAsH\r\nMessage-Delta: 1\r\n`,
    // );
}