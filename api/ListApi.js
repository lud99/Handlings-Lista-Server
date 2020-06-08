const List = require("../modules/ListSchema");

var UserApi = require("./UserApi");

const Utils = require("../utils/Utils");

const ResponseHandler = require("./ResponseHandler");

class ListApi {
    static async create(pin, name) {
        try {
            const list = await List.create({ name: name, userPin: pin });

            if (isEmpty(UserApi)) UserApi = require("./UserApi");

            const user = (await UserApi.getByPin(pin)).data;
            user.lists.push(list._id);

            await user.save();

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully added list '%s' to user '%s'", list.name, user.pin);

            return ResponseHandler.success(list);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async get(pin, query = { userPin: pin }, options = { one: false, populate: "items", sort: { items: "createdAt"} }) {
        try {
            const lists = await List[(options.one ? "findOne" : "find")](query).populate(options.populate).sort({ createdAt: 1 });

            return ResponseHandler.success(lists);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async getById(pin, listId, query = { _id: listId }, options = { populate: "items" }) {
        try {
            const list = await this.get(pin, query, { one: true, populate: options.populate, sort: { items: "-createdAt"} });

            return ResponseHandler.success(list);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async setItems(pin, listId, newItems, query = { userPin: pin, _id: listId }) {
        try {
            const list = (await this.getById(pin, listId, query)).data;

            list.items = newItems.map(item => item._id);

            await list.save();

            const listPopulated = await List.populate(list, "items");

            return ResponseHandler.success(listPopulated);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async reorderItems(pin, listId, itemOldPositionIndex, itemNewPositionIndex, query = { userPin: pin, _id: listId }) {
        try {
            const list = (await this.getById(pin, listId, query, { populate: "" })).data;

            const reorderedItems = reorder(list.items, itemOldPositionIndex, itemNewPositionIndex);
            
            list.items = reorderedItems;

            const updatedList = await list.save();

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully reordered an item from the user '%s's list '%s'", pin, list.name);

            return ResponseHandler.success(updatedList);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async rename(pin, listId, newName) {
        try {
            const list = (await this.getById(pin, listId)).data;

            if (list.name === newName)
                throw { message: "The list already has that name" };

            const oldName = list.name;

            list.name = newName;
            list.save();

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully renamed the list '%s' to '%s'", oldName, newName);

            return ResponseHandler.success(list);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async setCompleted(pin, listId, completed) {
        try {
            const list = (await this.getById(pin, listId)).data;

            list.completed = completed;

            list.save();

            return ResponseHandler.success(list);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async delete(pin, id, query = { userPin: pin, _id: id }, options = { one: true }) {
        try {
            query.userPin = pin; 
            query._id = id;

            await List.deleteOne(query);

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully deleted a list from the user '%s'", pin);

            return ResponseHandler.success({ listId: id });
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }
}

// Reorder moved items
const reorder = (items, startIndex, endIndex) => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

const isEmpty = (object) => JSON.stringify(object) === "{}"

module.exports = ListApi;