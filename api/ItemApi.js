const Item = require("../modules/ItemSchema");

const ListApi = require("./ListApi");

const ResponseHandler = require("./ResponseHandler");

class ItemApi {
    static async get(pin, query = { }, options = { one: false, sort: { createdAt: 1 } }) {
        try {
            query.userPin = pin;

            const items = await Item[(options.one ? "findOne" : "find")](query).sort(options.sort);

            return ResponseHandler.success(items);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async getById(pin, itemId, query = { userPin: pin, _id: itemId }) {
        try {
            query.userPin = pin;
            query._id = itemId;

            const item = await this.get(pin, query, { one: true });

            return ResponseHandler.success(item);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async updateState(pin, itemId, newCompletedState, query = { userPin: pin, itemId: itemId }, options = { one: true }) {
        try {
            query.userPin = pin;
            query.itemId = itemId;

            if (!newCompletedState) throw { message: "Invalid new completed state specified" }

            const item = (await this.getById(pin, itemId, { }, options)).data;

            if (!item) throw { message: "Invalid PIN or Item ID specified" }

            // Update the completed state
            if (newCompletedState == "toggle") // Toggle it
                item.completed = !item.completed;
            else
                item.completed = newCompletedState == "true"; // Set it to a bool

            item.save(); // Save the changes

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully updated the user '%s's item '%s's completed state to '%s'", pin, item.text, item.completed);

            return ResponseHandler.success(item);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async rename(pin, itemId, newText) {
        try {
            const item = (await this.getById(pin, itemId)).data;

            if (!item) throw { message: "Invalid PIN or Item ID specified" }

            if (item.text === newText)
                return ResponseHandler.error({ message: "The list already has that name" });

            const oldText = item.text;

            item.text = newText;

            item.save();

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully renamed the user '%s's item '%s' to '%s'", pin, oldText, newText);

            return ResponseHandler.success(item);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }


    static async create (pin, text, listId, completed = false) {
        try {
            if (!pin || !listId) throw { message: "Invalid PIN or ListId Specified"}

            const item = await Item.create({ text: text, listId: listId, userPin: pin, completed: completed });

            const list = (await ListApi.getById(pin, listId)).data;

            if (!list) throw { message: "Invalid PIN or ListId Specified"}

            // Add the item to the start of the array
            list.items.unshift(item);
            
            list.save(); // Save the changes

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully added item '%s' to user '%s's list '%s'", item.text, pin, list.name);

            return ResponseHandler.success(item);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async delete(pin, itemId, listId, query = { userPin: pin, _id: listId }, options = { one: false }) {
        try {
            query.userPin = pin;
            query._id = itemId;

            await Item[(options.one ? "deleteOne" : "deleteMany")](query);

            const list = (await ListApi.get(pin, { userPin: pin, _id: listId }, { one: true, populate: "" })).data;

            if (!list) throw { message: "Invalid PIN or ListId Specified" }

            for (let i = 0; i < list.items.length; i++) {
                if (list.items[i] == itemId)
                list.items.splice(i, 1);
            }
            
            list.save();

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully removed an item from user '%s's list '%s'", pin, list.name);

            return ResponseHandler.success({ listId: listId, itemId: itemId });
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }
}

module.exports = ItemApi;