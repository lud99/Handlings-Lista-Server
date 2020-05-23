const mongoose = require("mongoose");

const ItemSchema = mongoose.Schema({
    text: {
        type: String,
        require: true
    },
    completed: {
        type: Boolean,
        default: false
    },
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
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model("Item", ItemSchema);