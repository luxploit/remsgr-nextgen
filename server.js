const net = require('net');
const netPORT = 1863;

const isCommand = (line) => line.match(/^[A-Z]{3} /);

const handleVER = require('./handlers/VER');
const handleCVR = require('./handlers/CVR');

const server = net.createServer((socket) => {
  console.log('New client: ' + socket.remoteAddress + ":" + socket.remotePort);

  let previousCommand = null;

  socket.on('data', (data) => {
    const messages = data.toString().trim().split('\r\n');

    for (const message of messages) {
      if (isCommand(message)) {
        const command = message.toString().trim().split(' ');
        const data = previousCommand ? previousCommand.data : '';
        previousCommand = null;
        switch (command[0]) {
          case 'VER':
            handleVER(socket, command.slice(1), data);
            break;
          case 'CVR':
            handleCVR(socket, command.slice(1), data);
            break;
          case 'USR':
            socket.write('USR 3 SSO S MBI_KEY_OLD E4Fhehbe0q2Je+SUSp7IRnJV+rN4uME75ljIpUjIZ1Si+DgmrfuiIL+AFmkMA6Wv\r\n');
            break;
          default:
            socket.write('OUT\n');
        }
      } else {
        if (previousCommand) {
          previousCommand.data += message + '\r\n';
        }
      }
    }
  });

  socket.on('close', () => {
    console.log('Client closed: ' + socket.remoteAddress + ":" + socket.remotePort);
  });

  socket.on('error', (err) => {
    console.error(err);
  });
});

server.listen(netPORT, () => {
  console.log('MSN Server listening on port ' + netPORT);
});
