const mongoose = require("mongoose");

const UserSchema = mongoose.Schema({
    pin: {
        type: Number,
        minLength: 6,
        maxLength: 6
    },
    lists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "List",
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.handlingsLista.model("User", UserSchema);