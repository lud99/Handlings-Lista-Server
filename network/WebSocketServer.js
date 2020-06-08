const WebSocketServer = require("ws").Server;

const Client = require("./Client");
const Session = require("./Session");

const UserApi = require("../api/UserApi");
const ListApi = require("../api/ListApi");
const ItemApi = require("../api/ItemApi");

const ResponseHandler = require("../api/ResponseHandler");

const Utils = require("../utils/Utils");

const pingTime = 30000;

const logPingMessages = false;

const Send = {
    Single: 0,
    Broadcast: 1, 
}

let ws, sessions;

const start = (server, path) => {
    ws = new WebSocketServer({ server, path });

    console.log("Handlings Lista's WebSocketServer running on path '%s'", path)

    sessions = new Map();

    ws.on("connection", onConnection);
}

const onConnection = (conn) => {
    try {
        // Create client
        const client = new Client(conn, Utils.createId());
    
        if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
            console.log("Client '%s' connected", client.id);

        // Remove the client from any sessions
        conn.on("close", () => disconnectClient(client));

        // Handle messages
        conn.on("message", message => handleMessage(client, JSON.parse(message)));

        // Setup ping pong
        client.pingPongTimer = setInterval(() => pingPong(client), pingTime);
    } catch (error) {
        ResponseHandler.webSocketError(conn, error)
    }
}

const handleMessage = async (client, message) => {
    try {
        switch (message.type) {
            // Account
            case "login": {
                const response = await UserApi.login(message.pin);

                // Handle errors
                if (response.error) apiError(response.error);

                if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
                    console.log("Client '%s' logged in", client.id);

                // Join session
                joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Single)

                break;
            }
            case "valid-pin": {
                const response = await UserApi.valid(message.pin);

                // Handle errors
                if (response.error) apiError(response.error);

                sendResponse(client, message, response, Send.Single)

                break;
            }
            // Users
            case "create-user": {
                const response = await UserApi.create();

                // Handle errors
                if (response.error) apiError(response.error);

                sendResponse(client, message, response, Send.Single)

                break;
            }
            // Lists
            case "create-list": {
                const response = await ListApi.create(message.pin, message.name);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast)

                break;
            }
            case "remove-list": {
                const response = await ListApi.delete(message.pin, message.listId);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "rename-list": {
                const response = await ListApi.rename(message.pin, message.listId, message.newName);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "set-list-completed": {
                const response = await ListApi.setCompleted(message.pin, message.listId, message.completed);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "get-lists": {
                const response = await UserApi.get({ pin: message.pin }, { one: true });

                // Handle errors
                if (response.error) apiError(response.error);

                if (webSocketLogLevel == WebSocketLogLevels.Full)
                    console.log("Sending lists to client '%s' with the pin '%s'", client.id, message.pin);

                sendResponse(client, message, response, Send.Single);

                break;
            }
            case "get-list": {
                const response = await ListApi.getById(undefined, message.listId);

                // Handle errors
                if (response.error) apiError(response.error);

                // Also join the session if specified
                if (message.joinSession) joinSession(client, response.data.userPin);
                
                if (webSocketLogLevel == WebSocketLogLevels.Full)
                    console.log("Sending list '%s' to client '%s'", message.listId, client.id);

                sendResponse(client, message, response, Send.Single);

                break;
            }
            // List items
            case "create-list-item": {
                const response = await ItemApi.create(message.pin, message.text, message.listId);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "remove-list-item": {
                const response = await ItemApi.delete(message.pin, message.itemId, message.listId);

                // Handle errors
                if (response.error) apiError(response.error);
                
                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "update-list-item-state": {
                const newState = message.newState || "toggle";

                const response = await ItemApi.updateState(message.pin, message.itemId, message.listId, newState);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "reorder-list-items": {
                const { pin, listId, itemOldPositionIndex, itemNewPositionIndex, sortOrder } = message;
                
                const response = await ListApi.reorderItems(pin, listId, itemOldPositionIndex, itemNewPositionIndex);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }
            case "rename-list-item": {
                const response = await ItemApi.rename(message.pin, message.itemId, message.newText);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }
            case "set-list-items": {                
                const response = await ListApi.setItems(message.pin, message.listId, message.newItems);

                // Handle errors
                if (response.error) apiError(response.error);

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }

            // Sessions
            case "join-session": {
                const sessionId = parseInt(message.pin);

                joinSession(client, sessionId);

                sendResponse(client, message, undefined, Send.Single);
            } 

            // Ping Pong
            case "pong": {
                client.isAlive = true; // The client is still connected

                if (logPingMessages) console.log("Received pong from client '%s'", client.id);
                
                break;
            }

            default: {
                console.log("Other message:", message);

                break;
            }
        }
    } catch (error) {
        console.log(message);
        console.error(error);
    }
}

const pingPong = (client) => {
    // Terminate the connection with the client if it isn't alive
    if (!client.isAlive) return disconnectClient(client, "pingpong");

    // Default the client to being disconnected, but if a pong message is received from them they are considered still alive
    client.isAlive = false;

    if (logPingMessages) console.log("Sending ping to client '%s'", client.id);

    client.ping();
}

const disconnectClient = (client) => {
    const session = client.session;
            
    // If the client is in a session
    if (session) {
        session.leave(client); // Remove the client from the session

        if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
            console.log("Client '%s' disconnected, %s clients remaining in session '%s'", client.id, session.clients.size, session.id);

        // Remove the session if it's empty
        if (session.clients.size == 0) {
            sessions.delete(session.id);

            if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
                console.log("Removing empty session '%s'", session.id);
        }
    } else {
        if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
            console.log("Client '%s' disconnected", client.id);
    }

    // Remove the ping pong
    clearInterval(client.pingPongTimer);

    // Terminate the connection
    client.terminate();
}

const joinSession = (client, sessionId) => {
    // Make sure the pin is not a string (otherwise it causes duplicate sessions, one for the number and one for the string variant)
    sessionId = parseInt(sessionId);

    // Don't join the session if the client is already in it
    if (client.session && client.session.id === sessionId)
        return;

    // Create the session if it doesn't exists
    let session = sessions.get(sessionId);
    if (!session) {
        session = new Session(sessionId);
        sessions.set(sessionId, session);
    }

    client.joinSession(session);    

    if (webSocketLogLevel >= WebSocketLogLevels.Minimal)
        console.log("Adding client '%s' to Session '%s', %s clients in Session", client.id, sessionId, session.clients.size);
}

const sendResponse = (client, message, response, sendType = Send.Single) => {
    
    // Send back the type, callback id and api response
    const res = {
        ...message,
        ...response
    }

    if (sendType === Send.Single) 
        client.send(res);
    else if (sendType === Send.Broadcast)
        client.session.broadcast(res);
}

const apiError = (error) => console.log("API Error: '%s'", error.message) 

module.exports = start;