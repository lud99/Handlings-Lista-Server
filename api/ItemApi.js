const Item = require("../modules/ItemSchema");

const { ListUtils, ItemUtils, UserUtils } = require("./ApiUtils");

class ItemApi {
    static async create(pin, text, listId, completed = false) {
        if (!pin || !listId) throw "Invalid PIN or ListId Specified";

        // Get both the list and user at the same time
        const [list, user] = await Promise.all([
            ListUtils.getById(pin, listId),
            UserUtils.getByPin(pin)
        ]);

        if (list.completed) throw "List is completed. No changes can be made";

        const item = await Item.create({ 
            userPin: pin,
            text, 
            listId, 
            completed
        });

        if (!list) throw "Invalid PIN or ListId Specified";

        list.items.push(item);
        user.stats.createdItemsCount++;
        
        await Promise.all([ user.save(), list.save() ]);

        return item;
    }

    static async updateState(pin, itemId, listId, completed, toggleState = false) {
        // Get
        const [list, item, user] = await Promise.all([
            ListUtils.getById(pin, listId),
            ItemUtils.getById(pin, itemId),
            UserUtils.getByPin(pin)
        ]);

        if (!item) throw "Invalid PIN or Item ID specified";
        if (list.completed) throw "List is completed. No changes can be made";

        // Update the completed state by either toggling it or setting it
        toggleState ? item.completed = !item.completed : item.completed = completed;

        if (item.completed) {
            item.completedAt = new Date().toISOString(); // Only update date if its completed

            user.stats.completedItemsCount++; // Increment if completed
        } else {
            user.stats.completedItemsCount--; // Decrement if not completed
        }

        await Promise.all([ user.save(), item.save() ]);

        return item;
    }

    static async toggleState(pin, itemId, listId) {
        return await this.updateState(pin, itemId, listId, null, true);
    }

    static async rename(pin, itemId, newText) {
        const item = await ItemUtils.getById(pin, itemId);

        if (!item) throw "Invalid PIN or Item ID specified";

        if (item.text === newText) return item; 

        item.text = newText;

        item.save();

        return item;
    }

    static async delete(pin, itemId, listId, query = { userPin: pin, _id: listId }) {
        await Item.deleteOne(query);

        const [list, user] = await Promise.all([
            ListUtils.getById(pin, listId),
            UserUtils.getByPin(pin)
        ]);

        if (!list || !user) throw "Invalid PIN or ListId Specified";

        // Find the specified item, and then the index of it in the items array to easily remove it
        const itemToDeleteIndex = list.items.indexOf(list.items.find(item => item._id == itemId));

        list.items.splice(itemToDeleteIndex, 1);

        // Increment the user stats
        user.stats.deletedItemsCount++;

        await Promise.all([ list.save(), user.save() ]);

        return ({ listId: listId, itemId: itemId });
    }
}

module.exports = ItemApi;