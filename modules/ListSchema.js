const mongoose = require("mongoose");

const ListSchema = mongoose.Schema({
    displayId: { type: String },
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
    isHistoryList: { 
        type: Boolean,
        default: false
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: { type: Date },
    clearedAt: [{ type: Date }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.handlingsLista.model("List", ListSchema);