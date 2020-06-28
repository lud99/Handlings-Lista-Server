const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {        
        const uri = process.env.NODE_ENV === "dev" ? 
            process.env.MONGO_URI_HANDLINGS_LISTA_DEV : process.env.MONGO_URI_HANDLINGS_LISTA_PROD;

        // Try to connect
        const conn = await mongoose.createConnection(uri, {
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