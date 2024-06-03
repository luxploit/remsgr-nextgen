const chalk = require('chalk');
const { v4 } = require("uuid");

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

module.exports = async (socket, args) => {
    const transactionID = args[0];
    const transactionIDplusONE = parseInt(transactionID) + 1;

    socket.write(`ADL ${transactionID} OK\r\n`);
    socket.write(`MPOPEnabled: 1\r\nBetaInvites: 1\r\n\r\nUBX 1:${socket.passport} 0`);
    
    const guid = v4();
    const xml = `<Data><PSM></PSM><CurrentMedia></CurrentMedia><MachineGuid>{${guid}}</MachineGuid><DDP></DDP><SignatureSound></SignatureSound><Scene></Scene><ColorScheme></ColorScheme><EndpointData id="{${guid.toLowerCase()}}"><Capabilities>2788999212:48</Capabilities></EndpointData></Data>`;
    socket.write(`UBX 1:${socket.passport} ${xml.length}\r\n${xml}`);

    socket.write(`NLN NLN 1:${socket.passport} ${socket.passport} 1:48 0\r\n`);
    socket.write(`NLN FLN 1:nullptralt@escargot.chat nullptralt@escargot.chat 0000000000:48 0\r\nUBX 1:nullptralt@escargot.chat 319\r\n<Data><PSM></PSM><CurrentMedia></CurrentMedia><MachineGuid>{b67ff5eb-eabf-4471-bd7a-b5a41d95bcfb}</MachineGuid><DDP></DDP><SignatureSound></SignatureSound><Scene></Scene><ColorScheme></ColorScheme><EndpointData id="{b67ff5eb-eabf-4471-bd7a-b5a41d95bcfb}"><Capabilities>0000000000:48</Capabilities></EndpointData></Data>`);
    // await delay(1000);
    // socket.write(
    //     `MSG Hotmail Hotmail 195\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsinitialmdatanotification; charset=UTF-8\r\n\r\nMail-Data: <MD><E><I>0</I><IU>0</IU><O>0</O><OU>0</OU></E><Q><QTM>409600</QTM><QNM>204800</QNM></Q></MD>\r\n`,
    // );
    // socket.write(
    // 	`MSG Hotmail Hotmail 148\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsactivemailnotification; charset=UTF-8\r\n\r\nSrc-Folder: .!!OIM\r\nDest-Folder: .!!trAsH\r\nMessage-Delta: 1\r\n`,
    // );
    // socket.write(
    // 	`MSG Hotmail Hotmail 148\r\nMIME-Version: 1.0\r\nContent-Type: text/x-msmsgsactivemailnotification; charset=UTF-8\r\n\r\nSrc-Folder: .!!OIM\r\nDest-Folder: .!!trAsH\r\nMessage-Delta: 1\r\n`,
    // );
}