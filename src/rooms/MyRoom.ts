//#region Import libraries
import http from "http";
import { Room, Client, ServerError } from "colyseus";
import { Schema, type, MapSchema } from "@colyseus/schema";
//#endregion

//#region State
class PlayerState extends Schema {
    @type("boolean") connected = true;
    @type("number") elapsedTime = 0;
    @type("number") xPos = 0;
    @type("number") yPos = 0;
}
class MyRoomState extends Schema {
    @type("number") elapsedTime = 0;
    @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
//#endregion

//#region Room
export class MyRoom extends Room {
    // When room is initialized
    onCreate (options: any) {
        console.log("[MyRoom] onCreate:", {
            "roomId": this.roomId,
        });

        this.setState(new MyRoomState());
        this.setSimulationInterval((deltaTime) => this.update(deltaTime));
        // this.maxClients = 4;
    }

    // Authorize client based on provided options before WebSocket handshake is complete
    onAuth (client: Client, options: any, request: http.IncomingMessage) {
        console.log("[MyRoom] onAuth:", {
            "roomId": this.roomId,
            "clientId": client.sessionId,
        });

        if(options.password == 123){
            return true;
        }
        else{
            throw new ServerError(400, "bad access token");
        }
    }

    // When client successfully join the room
    onJoin (client: Client, options: any, auth: any) {
        console.log("[MyRoom] onJoin:", {
            "roomId": this.roomId,
            "clientId": client.sessionId,
        });

        this.state.players.set(client.sessionId, new PlayerState());
    }

    // When a client leaves the room
    async onLeave (client: Client, consented: boolean) {
        console.log("[MyRoom] onDisconnect:", {
            "roomId": this.roomId,
            "clientId": client.sessionId,
            "consented": consented,
        });

        // flag client as inactive for other users
        this.state.players.get(client.sessionId).connected = false;

        try {
            if (consented) {
                throw new Error("consented leave");
            }

            // allow disconnected client to reconnect into this room until 20 seconds
            await this.allowReconnection(client, 20);

            // client returned! let's re-activate it.
            this.state.players.get(client.sessionId).connected = true;

        } catch (e) {
            // 20 seconds expired. let's remove the client.
            this.state.players.delete(client.sessionId);
            
            console.log("[MyRoom] onLeave:", {
                "roomId": this.roomId,
                "clientId": client.sessionId,
                "consented": consented,
            });
        }
    }

    // Cleanup callback, called after there are no more clients in the room. (see `autoDispose`)
    onDispose () {
        console.log("[MyRoom] onDispose:", {
            "roomId": this.roomId,
        });
    }

    // Game loop
    update(deltaTime){
        this.state.elapsedTime += deltaTime;
        this.state.players.forEach((value, key) => {
            value.elapsedTime += deltaTime;
        });
    }
}
//#endregion