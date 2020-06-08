const mongoose = require("mongoose");

const ListSchema = mongoose.Schema({
    name: {
        type: String,
        default: "Namnlös lista"
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
    }],
    userPin: {
        type: Number,
        minLength: 6,
        maxLength: 6,
        require: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.handlingsLista.model("List", ListSchema);