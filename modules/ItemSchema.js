const mongoose = require("mongoose");

const ItemSchema = mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: { type: Date },
    listId: {
        type: String,
        minLength: 6,
        maxLength: 6,
        require: true
    },
    userPin: {
        type: Number,
        require: true
    },
    isHistoryItem: { 
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.handlingsLista.model("Item", ItemSchema);