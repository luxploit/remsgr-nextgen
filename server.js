const net = require('net');
const netPORT = 1863;

const isCommand = (line) => line.match(/^[A-Z]{3} /);

const handleVER = require('./handlers/VER');
const handleCVR = require('./handlers/CVR');

const server = net.createServer((socket) => {
    console.log('New client: ' + socket.remoteAddress);

    let accumulatedData = '';

    socket.on('data', (data) => {
        const messages = data.toString().trim().split('\r\n');

        for (const message of messages) {
            if (isCommand(message)) {
                const command = message.toString().trim().split(' ');
                const data = accumulatedData;
                accumulatedData = '';

                switch (command[0]) {
                    case 'VER':
                        console.log(message)
                        handleVER(socket, command.slice(1), data);
                        break;
                    case 'CVR':
                        console.log(message)
                        handleCVR(socket, command.slice(1), data);
                        break;
                    case 'USR':
                        console.log(message + "From USR")
                        socket.write('OUT\r\n');
                        break;
                    default:
                        socket.write('OUT\n');
                }
            } else {
                accumulatedData += message + '\r\n';
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
