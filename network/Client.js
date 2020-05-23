class Client {
    constructor(conn, id) {
        this.conn = conn;
        this.id = id;

        this.isAlive = true;

        this.pingPongTimer = null;

        this.session = null;
    }

    send(data) {
        this.conn.send(JSON.stringify(data));
    }

    ping() {
        this.send( {type: "ping" });
    }

    terminate() {
        this.conn.terminate();
    }

    joinSession(session) {
        // Leave the current session if one exists
        if (this.session) {
            const session = this.session;
            this.session.leave(this);

            console.log("Client '%s' leaving session '%s', %s clients in Session", this.id, session.id, session.clients.size);
        }

        this.session = session;
        this.session.clients.add(this);
    }
}

module.exports = Client;