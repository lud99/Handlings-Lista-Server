const List = require("../modules/ListSchema");

const Item = require("../modules/ItemSchema");

const { UserUtils, ListUtils } = require("./ApiUtils");

class ListApi {
    static async create(pin, name, items) {
        const list = await List.create({ name: name, userPin: pin });

        // Create new list items from the specified items (if there are any) 
        if (items && items.length > 0) {
            // Filter out the completed items
            const filteredItems = items.filter(item => !item.completed);

            const promises = filteredItems.map(item => Item.create({ 
                userPin: pin, 
                text: item.text, 
                listId: list._id, 
                completed: item.completed
            }));

            // Create all list items simuntaneously and set the list's items to it
            list.items = await Promise.all(promises);

            list.save();
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
        const list = await ListUtils.getById(pin, id);

        // Remove all of the list's items simultaneously
        await Promise.all(list.items.map(item => Item.deleteOne({ _id: item._id })));

        // Remove the list itself
        await List.deleteOne({ userPin: pin, _id: id });

        // TODO: Remove the user's reference to the list

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