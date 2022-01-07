//#region Import libraries
import { Server, RelayRoom } from "colyseus";
import { createServer } from "http";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { monitor } from "@colyseus/monitor";
import express from "express";
import basicAuth from "express-basic-auth";
import rateLimit from "express-rate-limit";
//#endregion

//#region Import configuration files
require('dotenv').config({
    path: __dirname + '/.env'
});
import config from "../server-config.json";
import { MyRoom } from "./rooms/MyRoom";
//#endregion

//#region Define port
const port = parseInt(process.env.PORT, 10) || 3000;
//#endregion

//#region Define basic auth
const username = process.env.MONITOR_USERNAME || 'admin';
const password = process.env.MONITOR_PASSWORD || 'admin';
const basicAuthMiddleware = basicAuth({
    users: {
        [username]: password
    },
    challenge: true
});
//#endregion

//#region Define rate limit
const apiLimiter = rateLimit({
    windowMs: config.rateLimitMinutes * 60 * 1000,
    max: config.rateLimitRequests,
});
//#endregion

//#region Initialize express
const app = express();
app.get("/", (req, res) => {
    res.send("Welcome to Colyseus");
});
app.use("/colyseus", basicAuthMiddleware, monitor());
app.use("/matchmake/", apiLimiter);
app.set('trust proxy', 1);
//#endregion

//#region Intialize game server
const gameServer = new Server({
    transport: new WebSocketTransport({
        server: createServer(app),
    }),
});
gameServer.define("RelayRoom", RelayRoom);
gameServer.define("MyRoom", MyRoom);
//#endregion

//#region Listen on port
gameServer.listen(port);
console.log(`[GameServer] Listening on port ${port}`);
//#endregion