const WebSocketServer = require("ws").Server;

const Client = require("./Client");
const Session = require("./Session");

const UserApi = require("../api/UserApi");
const ListApi = require("../api/ListApi");
const ItemApi = require("../api/ItemApi");

const { ListUtils } = require("../api/ApiUtils");

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

    console.log("Handlingslista's WebSocketServer running on path '%s'", path)

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
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    UserApi.login(message.pin)
                );

                if (response.success && webSocketLogLevel >= WebSocketLogLevels.Minimal)
                    console.log("Client '%s' logged in", client.id);

                // Join session
                if (response.success) joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Single)

                break;
            }
            case "valid-pin": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    UserApi.valid(message.pin)
                );

                sendResponse(client, message, response, Send.Single)

                break;
            }
            // Users
            case "create-user": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    UserApi.create()
                );

                sendResponse(client, message, response, Send.Single)

                break;
            }
            // Lists
            case "create-list": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.create(message.pin, message.name, message.items)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "remove-list": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.delete(message.pin, message.listId)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "rename-list": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.rename(message.pin, message.listId, message.newName)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break;
            }
            case "set-list-completed": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.setCompleted(message.pin, message.listId, message.completed)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "get-user": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    UserApi.get({ pin: message.pin }, { one: true })
                );

                if (webSocketLogLevel == WebSocketLogLevels.Full)
                    console.log("Sending user to client '%s' with the pin '%s'", client.id, message.pin);

                sendResponse(client, message, response, Send.Single);

                break;
            }
            case "get-list": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListUtils.getByDisplayId(message.displayListId).populate("items")
                );

                // Also join the session if specified
                if (message.joinSession) joinSession(client, response.data.userPin);
                
                if (webSocketLogLevel == WebSocketLogLevels.Full)
                    console.log("Sending list '%s' to client '%s'", message.listId, client.id);

                sendResponse(client, message, response, Send.Single);

                break;
            }
            // List items
            case "create-list-item": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ItemApi.create(message.pin, message.text, message.listId)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "remove-list-item": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ItemApi.delete(message.pin, message.itemId, message.listId)
                );
                
                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "toggle-list-item-state": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ItemApi.toggleState(message.pin, message.itemId, message.listId)
                );
                
                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "update-list-item-state": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ItemApi.updateState(message.pin, message.itemId, message.listId, message.state)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin); 

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

                break;
            }
            case "reorder-list-items": {
                const { pin, listId, itemOldPositionIndex, itemNewPositionIndex } = message;

                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.reorderItems(pin, listId, itemOldPositionIndex, itemNewPositionIndex)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }
            case "rename-list-item": {
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ItemApi.rename(message.pin, message.itemId, message.newText)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }
            case "set-list-items": {              
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.setItems(message.pin, message.listId, message.newItems)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                break; 
            }
            case "remove-completed-items": {              
                // Access the api functions through this function to automatically catch any errors 
                const response = await accessApi(
                    ListApi.removeCompletedItems(message.pin, message.listId)
                );

                // Join session if the client is for some reason not in one
                if (!client.session)
                    joinSession(client, message.pin);

                sendResponse(client, message, response, Send.Broadcast);

                // Broadcast stats to all clients
                broadcastStats(client, message.pin);

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

const broadcastStats = async (client, pin) => {
    sendResponse(client, { type: "stats-broadcast" }, await accessApi(UserApi.getStats(pin)), Send.Broadcast);
}

const accessApi = async (promise) => {
    try {
        const data = await promise;

        return ResponseHandler.success(data);
    } catch (error) {
        return ResponseHandler.error(error);
    }
}

module.exports = start;