class RoomModel {
    constructor(id) {
        this.id = id;
        this.participants = [];
        this.isFull = false;
    }

    addParticipant(participant) {
        this.participants.push(participant);
        this.updateRoomState();
    }

    removeParticipant(participant) {
        this.participants = this.participants.filter((participantToCheck) => {
            return participantToCheck.id !== participant.id;
        });
        this.updateRoomState();
    }

    updateRoomState() {
        if (this.participants.length >= 2) {
            this.isFull = true;
        } else {
            this.isFull = false;
        }
    }
}

class RoomsRepo {
    constructor() {
        this.rooms = [];
    }

    isUniqueId(id) {
        for (let room of this.rooms) {
            if (room.id === id)
                return false;
        }

        return true;
    }

    generateId(length) {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = "R";

        for (let i = 0; i < length; i++) {
            id += characters.charAt(Math.floor(Math.random() * characters.length));
        }

        if (!this.isUniqueId(id)) {
            return this.generateId(length);
        }
        else return id;
    }

    addNewRoom() {
        let roomId = this.generateId(14);
        let room = new RoomModel(roomId);

        this.rooms.push(room);

        return room;
    }

    logRooms() {
        console.log("rooms List:");
        console.dir(
            this.rooms,
            { depth: 3, colors: true }
        );
    }

    getRoomById(roomId) {
        for (let room of this.rooms) {
            if (room.id !== roomId) continue;
            return room;
        }

        console.error('room not found');
    }

    removeParticipantFromRoom(participant) {
        let room = this.getRoomById(participant.roomId);

        if (room.participants.length <= 1) {
            console.log('room', room.id, 'will be deleted because it is empty');
            this.deleteRoom(room.id);
        } else {
            room.removeParticipant(participant);
        }

        participant.roomId = undefined;
    }

    deleteRoom(roomId) {
        this.rooms = this.rooms.filter((room) => {
            return room.id !== roomId;
        });
    }
}

export { RoomModel, RoomsRepo };

