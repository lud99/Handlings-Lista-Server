const User = require("../modules/UserSchema");
const List = require("../modules/ListSchema");
const Item = require("../modules/ItemSchema");

const UserUtils = {
    getByPin: (pin) => User.findOne({ pin: pin })
}

const ListUtils = {
    getById: (pin, id, options = { populate: "items" }) => List.findOne({ userPin: pin, _id: id }).populate(options.populate),
}

const ItemUtils = {
    getById: (pin, id) => Item.findOne({ userPin: pin, _id: id }),
}

module.exports.UserUtils = UserUtils;
module.exports.ListUtils = ListUtils;
module.exports.ItemUtils = ItemUtils;