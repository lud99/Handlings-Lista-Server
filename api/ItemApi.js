const Item = require("../modules/ItemSchema");

const { ListUtils, ItemUtils } = require("./ApiUtils");

class ItemApi {
    static async create(pin, text, listId, completed = false) {
        if (!pin || !listId) throw "Invalid PIN or ListId Specified";

        const list = await ListUtils.getById(pin, listId);

        if (list.completed) throw "List is completed. No changes can be made";

        const item = await Item.create({ 
            userPin: pin,
            text, 
            listId, 
            completed
        });

        if (!list) throw "Invalid PIN or ListId Specified";

        list.items.push(item);
        
        list.save();

        return item;
    }

    static async updateState(pin, itemId, listId, completed, toggleState = false) {
        // Get both the list and item at the same time
        const [list, item] = await Promise.all([
            ListUtils.getById(pin, listId),
            ItemUtils.getById(pin, itemId)
        ]);

        if (!item) throw "Invalid PIN or Item ID specified";
        if (list.completed) throw "List is completed. No changes can be made";

        // Update the completed state by either toggling it or setting it
        toggleState ? item.completed = !item.completed : item.completed = completed;

        item.save();

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

        const list = await ListUtils.getById(pin, listId);

        if (!list) throw "Invalid PIN or ListId Specified";

        // Find the specified item, and then the index of it in the items array to easily remove it
        const itemToDeleteIndex = list.items.indexOf(list.items.find(item => item._id == itemId));

        list.items.splice(itemToDeleteIndex, 1);

        list.save();

        return ({ listId: listId, itemId: itemId });
    }
}

module.exports = ItemApi;