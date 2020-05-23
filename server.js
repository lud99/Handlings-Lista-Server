const express = require("express");
const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");

const { connectDB } = require("./config/db");

const WebSocketServer = require('./network/WebSocketServer');

const app = express();

// Cors
app.use(cors());

// Json
app.use(express.json());

// Routes
app.use("/api/v1/users", require("./routes/users"));
app.use("/api/v1/users/lists", require("./routes/lists"));
app.use("/api/v1/users/lists/items", require("./routes/items"));

// Load env
dotenv.config({ path: "./config/config.env" });

// Connect to database
connectDB();

global.WebSocketLogLevels = {
    None: 0,
    Minimal: 1,
    Full: 2
}

global.webSocketLogLevel = WebSocketLogLevels.Minimal;

// Start websocket server
const server = http.createServer(app);

WebSocketServer(server);

// Start http server
const port = process.env.app_port || process.env.PORT || 8080;

server.listen(port, () => console.log("Server listening on port", port));
