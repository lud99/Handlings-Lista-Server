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
    historyLists: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "List"
    }],
    stats: {
        createdItemsCount: { type: Number, default: 0 },
        createdListsCount: { type: Number, default: 0 },

        completedItemsCount: { type: Number, default: 0 },
        completedListsCount: { type: Number, default: 0 },

        deletedItemsCount: { type: Number, default: 0 },
        deletedListsCount: { type: Number, default: 0 },
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = connections.handlingsLista.model("User", UserSchema);