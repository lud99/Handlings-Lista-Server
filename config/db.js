const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {        
        console.log(process.env.MONGO_URI_HANDLINGS_LISTA)
        // Try to connect
        const conn = await mongoose.createConnection(process.env.MONGO_URI_HANDLINGS_LISTA, {
            useNewUrlParser: true,
            useFindAndModify: false,
            useCreateIndex: true,
            useUnifiedTopology: true
        });

        global.connections.handlingsLista = conn;

        console.log(`MongoDB connected: ${conn.host}`);
    } catch (error) {
        console.error(error);
    }
}