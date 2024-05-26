const net = require('net');
const netPORT = 1863;

const isCommand = (line) => line.match(/^[A-Z]{3} /);

const handleVER = require('./handlers/VER');
const handleCVR = require('./handlers/CVR');
const handleUSR = require('./handlers/USR');

const server = net.createServer((socket) => {
    console.log('New client: ' + socket.remoteAddress);

    socket.on('data', (data) => {
        const messages = data.toString().trim().split('\r\n');

        for (const message of messages) {
            if (isCommand(message)) {
                const command = message.toString().trim().split(' ');

                switch (command[0]) {
                    case 'VER':
                        handleVER(socket, command.slice(1), data);
                        break;
                    case 'CVR':
                        handleCVR(socket, command.slice(1), data);
                        break;
                    case 'USR':
                        handleUSR(socket, command.slice(1), data);
                        break;
                    default:
                        socket.write('OUT\r\n');
                }
            }
        }
    });

    socket.on('close', () => {
        console.log('Client closed: ' + socket.remoteAddress);
    });

    socket.on('error', (err) => {
        console.error(err);
    });
});

server.listen(netPORT, () => {
    console.log('MSN Server listening on port ' + netPORT);
});
