import { WebSocket } from 'ws';
import { createInterface } from 'readline';

const wsServer = new WebSocket('ws://localhost:8001', {
    rejectUnauthorized: false  // This will allow the connection with a self-signed certificate
});
let participantId;
let roomId;

wsServer.on('open', () => {
    console.log('Connected to server');
});

wsServer.on('message', (message) => {
    let messageObj = JSON.parse(message.toString());

    switch (messageObj.type) {
        case "message":
            if (messageObj.senderId === participantId) break;

            if (messageObj.senderId === undefined)
                console.log("unauthinticated sender:", messageObj.message);
            else
                console.log("message from", messageObj.senderId, ":", messageObj.message);
            break;

        case "participantId":
            participantId = messageObj.participantId;
            console.log("participantId set:", participantId);
            wsServer.send(JSON.stringify({ type: 'message', senderId: participantId, message: 'Hello server!' }));
            break;

        case 'createRoom':
            roomId = messageObj.roomId;
            console.log("roomId set:", roomId);
            break;
    }
});

wsServer.on('close', () => {
    console.log('Disconnected from server');
    wsServer.close();
    rl.close();
});

wsServer.on('error', (error) => {
    console.error('WebSocket error:', error);
});

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Enter 'close' to quit.");

rl.on('line', (input) => {
    switch (input) {
        case 'createRoom':
            {
                let message = JSON.stringify({
                    type: 'createRoom',
                });
                wsServer.send(message);
                break;
            }
        case 'joinRoom':
            {
                let message = JSON.stringify({
                    type: 'joinRoom',
                    roomId: "RJ3KgQ7mv0ZeCw0"
                });
                wsServer.send(message);
                break;
            }
        case 'hangup':
            {
                let message = JSON.stringify({
                    type: 'hangup',
                });
                wsServer.send(message);

                console.log('Goodbye!');
                rl.close();
                wsServer.close();

                break;
            }
        default:
            {
                let message = JSON.stringify({
                    type: 'message',
                    senderId: participantId,
                    message: input
                });
                wsServer.send(message);
                break;
            }
    }
});
