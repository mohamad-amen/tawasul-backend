class ParticipantModel {
    constructor(id, webSocket) {
        this.id = id;
        this.webSocket = webSocket;
        this.roomId;
    }

    setRoomId(roomId) {
        this.roomId = roomId;
    }

    leaveRoom() {
        this.roomId = null;
    }
}

class ParticipantsRepo {
    constructor() {
        this.participants = [];
    }

    isUniqueId(id) {
        for (let participant of this.participants) {
            if (participant.id === id)
                return false;
        }

        return true;
    }

    generateId(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = "P";

        for (let i = 0; i < length; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        if (!this.isUniqueId(id)) {
            return this.generateId(length);
        }
        else return id;
    }

    addParticipant(client) {
        let participantId = this.generateId(14);
        let participant = new ParticipantModel(participantId, client);

        this.participants.push(participant);

        return participant;
    }


    removeParticipant(participantId) {
        this.participants = this.participants.filter((participant) => {
            return participant.id !== participantId;
        });
    }

    logParticipants() {
        console.log("participants List:");
        console.dir(
            this.participants,
            { depth: 1, colors: true }
        );
    }

    getParticipantById(participantId) {
        for (let participant of this.participants) {
            if (participant.id !== participantId) continue;
            return participant;
        }

        console.error('participant ' + participantId + ' not found');
    }
}

export { ParticipantModel, ParticipantsRepo };

