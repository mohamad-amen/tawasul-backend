import { WebSocketServer } from "ws";
import { createInterface } from 'readline';
import { RoomsRepo } from './models/roomModel.js';
import { ParticipantsRepo } from './models/participantModel.js';


const port = 8001;
const wsServer = new WebSocketServer({port: port});

let roomsRepo = new RoomsRepo();
let participantsRepo = new ParticipantsRepo();


function createRoom(participantId) {
    let room = roomsRepo.addNewRoom();
    let participant = participantsRepo.getParticipantById(participantId);

    console.log("created room with id:", room.id);

    let message = JSON.stringify({
        type: 'createRoom',
        roomId: room.id
    });

    participant.webSocket.send(message);

    return room
}

function addToRoom(participantId, roomId, messageType) {
    let participant = participantsRepo.getParticipantById(participantId);
    let room = roomsRepo.getRoomById(roomId);

    if(room === undefined){
        let message = JSON.stringify({
            type: 'joinRoom',
            error: 'Room ID is incorrect, this room does not exist',
        });

        participant.webSocket.send(message);
        return;
    }else if(room.isFull){
        let message = JSON.stringify({
            type: 'joinRoom',
            error: 'This room is full!',
        });

        participant.webSocket.send(message);
        return;
    }

    room.addParticipant(participant);
    participant.setRoomId(roomId);

    if(messageType === 'joinRoom'){
        let message = JSON.stringify({
            type: 'joinRoom',
        });

        participant.webSocket.send(message);
   
        sendToRoom(JSON.stringify({ type: "newParticipant" }), participantId);
    }

    console.log(participantId, "was added to room", roomId);
}



function broadCastMessage(message) {
    let clients = wsServer.clients;

    for (let client of clients) {
        client.send(message);
    }
}

//message is json string
function sendToRoom(message, participantId) {
    let participant = participantsRepo.getParticipantById(participantId);
    let room = roomsRepo.getRoomById(participant.roomId);

    room.participants.forEach((participant) => {
        if (participant.id === participantId) return;

        participant.webSocket.send(message);
    });
}

function handleNewClient(client) {
    let participant = participantsRepo.addParticipant(client);

    let message = JSON.stringify({
        type: 'participantId',
        participantId: participant.id
    });
    client.send(message);

    console.log("new participant added with id:", participant.id);
    console.log("there is", wsServer.clients.size, "clients");

    return participant;
}

function hangup(participantId) {
    let participant = participantsRepo.getParticipantById(participantId);

    let message = JSON.stringify({'type': "otherParticipantDisconnected"});
    sendToRoom(message, participantId);
    
    roomsRepo.removeParticipantFromRoom(participant);
    
    console.log("participant", participant.id, "just hungup from room", participant.roomId);
}

function onClosed(participantId) {
    let participant = participantsRepo.getParticipantById(participantId);

    let message = JSON.stringify({'type': "otherParticipantDisconnected"});
    sendToRoom(message, participantId);

    if (participant.roomId !== undefined) {
        roomsRepo.removeParticipantFromRoom(participant);
    }

    participantsRepo.removeParticipant(participant.id);

    console.log('disconnected client:', participantId);
    console.log("there is", wsServer.clients.size, "clients");
}


function onMessage(messageBuffer, participantId) {
    let messageObj = JSON.parse(messageBuffer.toString());

    switch (messageObj.type) {
        case 'createRoom':
            let room = createRoom(participantId);
            addToRoom(participantId, room.id, messageObj.type);
            break;


        case 'joinRoom':
            addToRoom(participantId, messageObj.roomId, messageObj.type);
            break;


        case 'offerSDP':
            sendToRoom(messageBuffer.toString(), participantId);
            console.log(messageObj);
            break;


        case 'answerSDP':
            sendToRoom(messageBuffer.toString(), participantId);
            console.log(messageObj);
            break;


        case 'ice':
            sendToRoom(messageBuffer.toString(), participantId);
            console.log(messageObj);
            break;


        case 'message':
            console.log('Received from', messageObj.senderId, ':', messageObj.message);
            broadCastMessage(messageBuffer.toString());
            break;


        case 'hangup':
            hangup(participantId);
            break;


        case 'logRepos':
            participantsRepo.logParticipants();
            roomsRepo.logRooms();
            break;


        default:
            console.log('Unknown message type:', messageObj);
    }
}

function closeAllConnections() {
    for (let client of wsServer.clients) {
        client.close();
    }
}

wsServer.on('connection', (client) => {
    let participant = handleNewClient(client);

    client.on('message', (message) => onMessage(message, participant.id));

    client.on('close', () => onClosed(participant.id));

    client.send(
        JSON.stringify({
            type: 'message',
            senderId: 'server',
            message: 'Welcome to the WebSocket server!'
        }));
});

console.log('>> WebSocket server is running <<');

const rl = createInterface({
    input: process.stdin,
    output: process.stdout
});


rl.on('line', (input) => {
    switch (input) {
        case 'kill':
            console.log('Goodbye!');
            closeAllConnections();
            wsServer.close();
            rl.close();
            break;

        case 'logRepos':
            participantsRepo.logParticipants();
            roomsRepo.logRooms();
            break;

        default:
            console.log('Unknown command:', input);
    }
})