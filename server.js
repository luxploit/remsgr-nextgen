const net = require('net');
const netPORT = 1863;

const handleVER = require('./handlers/VER');

const server = net.createServer((socket) => {
    console.log('New client: ' + socket.remoteAddress);

    socket.on('data', (data) => {
        const command = data.toString().trim().split(' ');
        switch (command[0]) {
            case 'VER':
                handleVER(socket, command.slice(1));
                break;
            default:
                socket.write('OUT Unknown command\n');
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