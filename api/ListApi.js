const List = require("../modules/ListSchema");

const ItemApi = require("./ItemApi");

const { UserUtils, ListUtils } = require("./ApiUtils");

class ListApi {
    static async create(pin, name, items) {
        const list = await List.create({ name: name, userPin: pin });

        // Create new list items from the specified items (if there are any) 
        if (items && items.length > 0) {
            const promises = items.map(item => ItemApi.create(pin, item.text, list._id, item.completed));

            // Create all list items simuntaneously and get the data from the responses
            const listItems = await Promise.all(promises);

            list.items = listItems.map(item => item._id);

            await list.save();
        }

        const user = await UserUtils.getByPin(pin);
        user.lists.push(list._id);

        user.save();

        return list;
    }

    static async setItems(pin, listId, newItems) {
        const list = await ListUtils.getById(pin, listId);

        list.items = newItems.map(item => item._id);

        await list.save();

        const listPopulated = await List.populate(list, "items");

        return listPopulated;
    }

    static async reorderItems(pin, listId, itemOldPositionIndex, itemNewPositionIndex) {
        const list = await ListUtils.getById(pin, listId, { populate: "" });

        const reorderedItems = reorder(list.items, itemOldPositionIndex, itemNewPositionIndex);
        
        list.items = reorderedItems;

        list.save();

        return list;
    }

    static async rename(pin, listId, newName) {
        const list = await ListUtils.getById(pin, listId);

        if (list.name === newName) return list;

        list.name = newName;
        list.save();

        return list;
    }

    static async setCompleted(pin, listId, completed) {
        const list = await ListUtils.getById(pin, listId);

        list.completed = completed;

        list.save();

        return list;
    }

    static async delete(pin, id) {
        await List.deleteOne({ userPin: pin, _id: id });

        return ({ listId: id });
    }
}

// Reorder moved items
const reorder = (items, startIndex, endIndex) => {
    const result = Array.from(items);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);

    return result;
};

module.exports = ListApi;