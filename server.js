// Import the app
const app = require("./app")();

const https = require("https");

const port = 1234;

var server;
if (fs.existsSync(process.env.PRIV_KEY)) {
    server = https.createServer({
        key: fs.readFileSync(process.env.PRIV_KEY),
        cert: fs.readFileSync(process.env.CERT),
    });
}

server.listen(port, () => console.log("Handlingslista running on port", port))

// Start the server
app.startServer("/handlingslista");