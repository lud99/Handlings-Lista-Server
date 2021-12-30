const express = require("express");
const dotenv = require("dotenv");
const ws = require("ws").Server;
const cors = require("cors");

const { connectDB } = require("./config/db");

// Load env
dotenv.config({ path: __dirname + "/config/config.env" });
dotenv.config({ path: __dirname + "/config/secrets.env" });

// Setup the websocket log level
global.WebSocketLogLevels = {
    None: 0,
    Minimal: 1,
    Full: 2
}

const router = express.Router();

// CORS
router.use(cors());

// JSON
router.use(express.json());

global.webSocketLogLevel = process.env.WEBSOCKET_LOG_LEVEL || WebSocketLogLevels.Minimal;

// Set up global connections variable
if (!global.connections) global.connections = {};

module.exports = () => {
    const module = {};

    // Connect to the database, then start http and WebSocket server
    module.startServer = async (server, absolutePath = "/") => {
        await connectDB();

        const WebSocketServer = require('./network/WebSocketServer');
        WebSocketServer.init(absolutePath);

        var wss = new ws({
            server: server,
            path: absolutePath
        });

        wss.on("connection", WebSocketServer.onConnection);

        //router.websocket("/", (info, cb) => cb(WebSocketServer.onConnection));
        
        // Routes
        router.use("/api/v1/users", require("./routes/users"));
        router.use("/api/v1/users/lists", require("./routes/lists"));
        router.use("/api/v1/users/lists/items", require("./routes/items"));
    }

    module.app = router;

    return module;
}