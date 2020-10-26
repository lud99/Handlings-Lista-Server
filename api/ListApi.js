const List = require("../modules/ListSchema");

const Item = require("../modules/ItemSchema");

const { UserUtils, ListUtils } = require("./ApiUtils");

const Utils = require("../utils/Utils");

class ListApi {
    static async create(pin, name, items) {
        const allLists = await List.find();

        let list;

        const maxIterations = 20;
        for (let i = 0; i < maxIterations; i++) {
            const displayId = Utils.createIdLetters(10);

            // Check if a list with the id doesn't exist
            if (!allLists.find(list => list.displayId === displayId)) {
                list = await List.create({ 
                    displayId: displayId, 
                    name: name, 
                    userPin: pin 
                });

                break;
            }
        }

        if (!list) throw "Duplicate list display ids"; // Should happen...

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
        user.stats.createdListsCount++;

        await user.save();

        return list;
    }

    static async setItems(pin, listId, newItems) {
        const list = await ListUtils.getById(pin, listId);

        list.items = newItems.map(item => item._id);

        await list.save();

        return await List.populate(list, "items");
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
        const [list, user] = await Promise.all([
            ListUtils.getById(pin, listId),
            UserUtils.getByPin(pin)
        ]);

        list.completed = completed;
        list.completedAt = new Date().toISOString(); // Set it to the current date

        // Save to history
        user.historyLists.push(await this.createHistoryList(list));
        user.stats.completedListsCount++; // Update stats

        await Promise.all([ list.save(), user.save() ]);

        return list;
    }

    static async removeCompletedItems(pin, listId) {
        const [list, user] = await Promise.all([
            ListUtils.getById(pin, listId).populate("items"),
            UserUtils.getByPin(pin)
        ]);

        list.clearedAt.push(new Date().toISOString()); // Add the current date

        await list.save();

        // Save to history
        user.historyLists.push(await this.createHistoryList(list));
        user.stats.completedListsCount++; // Update stats

        list.items = list.items.filter(item => !item.completed); // Filter out the completed items

        await Promise.all([ user.save(), list.save() ]); // Save both simultaneously

        return list;
    }

    static async delete(pin, id) {
        const [list, user] = await Promise.all([
            ListUtils.getById(pin, id),
            UserUtils.getByPin(pin)
        ]);

        // Remove all of the list's items simultaneously
        await Promise.all(list.items.map(item => Item.deleteOne({ _id: item._id })));

        // Remove the list itself
        await List.deleteOne({ userPin: pin, _id: id });

        // Remove the user's reference to the list
        user.lists.splice(user.lists.indexOf(id), 1);

        // Increment the user stats
        user.stats.deletedListsCount++;
        user.stats.deletedItemsCount += list.items.length; // Count the items too

        await user.save();
        
        return ({ listId: id });
    }

    static async createHistoryList(list) {
        const listData = { 
            name: list.name, 
            clearedAt: list.clearedAt, 
            userPin: list.userPin, 
            createdAt: list.createdAt, 
            completedAt: new Date().toISOString(), // Current date 
            isHistoryList: true 
        };

        const [historyList, historyItems] = await Promise.all([
            await List.create(listData),
            await Promise.all(
                list.items.map(({ text, completed, completedAt, createdAt }) => Item.create({ 
                    userPin: list.userPin, 
                    listId: list._id, 
                    text, 
                    completed, 
                    completedAt,
                    createdAt, 
                    isHistoryItem: true 
                })))
        ]);

        for (let i = 0; i < historyItems.length; i++) {
            historyItems[i].listId = historyList._id; // Set the proper id
            historyItems[i].save();
        }

        historyList.items = historyItems.map(item => item._id);

        return await historyList.save();
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