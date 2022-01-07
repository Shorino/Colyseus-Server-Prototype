import http from "http";
import { Room, Client, ServerError } from "colyseus";

export class MyRoom extends Room {
    // When room is initialized
    async onCreate (options: any) {
        console.log("[MyRoom] Room", this.roomId, "created");
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    async onAuth (client: Client, options: any, request: http.IncomingMessage) {
        return true;
        // throw new ServerError(400, "bad access token");
    }

    // When client successfully join the room
    async onJoin (client: Client, options: any, auth: any) {
        console.log("[MyRoom] Client", client.id, "joined room", this.roomId);
    }

    // When a client leaves the room
    async onLeave (client: Client, consented: boolean) {
        console.log("[MyRoom] Client", client.id, "left room", this.roomId);
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    async onDispose () {
        console.log("[MyRoom] Room", this.roomId, "disposed");
    }
}