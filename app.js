const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");

const { connectDB } = require("./config/db");

// Load env
dotenv.config({ path: __dirname + "/config/config.env" });
dotenv.config({ path: __dirname + "/config/secrets.env" });

const app = express();

// CORS
app.use(cors());

// JSON
app.use(express.json());

// Setup the websocket log level
global.WebSocketLogLevels = {
    None: 0,
    Minimal: 1,
    Full: 2
}

global.webSocketLogLevel = process.env.WEBSOCKET_LOG_LEVEL || WebSocketLogLevels.Minimal;

// Set up global connections variable
if (!global.connections) global.connections = {};

module.exports = () => {
    const module = {};

    const PORT = process.env.HANDLINGS_LISTA_PORT || 8080;

    // Connect to the database, then start http and WebSocket server
    module.startServer = async (server, path = "/") => {
        await connectDB();

        const WebSocketServer = require('./network/WebSocketServer');
        
        // Routes
        app.use("/api/v1/users", require("./routes/users"));
        app.use("/api/v1/users/lists", require("./routes/lists"));
        app.use("/api/v1/users/lists/items", require("./routes/items"));

        // Create and start the server manually if none is specified
        if (!server) {
            server = http.createServer(app);

            server.listen(PORT, () => console.log("Handlings Lista's WebSocketServer running on port", PORT));
        }

        // Start websocket server
        WebSocketServer(server, path);
    }

    module.app = app;

    return module;
}