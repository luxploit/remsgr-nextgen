const net = require('net');
const netPORT = 1863;

const handleVER = require('./handlers/VER');
const handleCVR = require('./handlers/CVR');

const server = net.createServer((socket) => {
    console.log('New client: ' + socket.remoteAddress);

    let buffer = '';
    let currentCommand = null;
    let commandBuffer = [];

    socket.on('data', (data) => {
        buffer += data.toString();
        
        const messages = buffer.split('\r\n');
        buffer = messages.pop();

        for (const message of messages) {
            if (/^[A-Z]{3} /.test(message)) {
                if (currentCommand !== null) {
                    processCommand(socket, currentCommand, commandBuffer);
                }
                currentCommand = message.trim().split(' ')[0];
                commandBuffer = [message];
            } else {
                if (currentCommand !== null) {
                    commandBuffer.push(message);
                } else {
                    console.error('Received data without a command: ' + message);
                }
            }
        }

        if (currentCommand !== null) {
            processCommand(socket, currentCommand, commandBuffer);
            currentCommand = null;
            commandBuffer = [];
        }
    });

    socket.on('close', () => {
        console.log('Client closed: ' + socket.remoteAddress);
    });

    socket.on('error', (err) => {
        console.error(err);
    });
});

function processCommand(socket, command, commandBuffer) {
    const commandString = commandBuffer.join('\r\n');
    const args = commandString.split(' ').slice(1);
    
    switch (command) {
        case 'VER':
            handleVER(socket, args);
            break;
        case 'CVR':
            handleCVR(socket, args);
            break;
        case 'USR':
            socket.write('OUT \r\n');
            break;
        default:
            // Log or handle unknown command
            console.log(`Unknown command received: ${commandString}`);
            socket.write('OUT \r\n');
    }
}

server.listen(netPORT, () => {
    console.log('MSN Server listening on port ' + netPORT);
});
