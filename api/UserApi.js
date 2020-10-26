const User = require("../modules/UserSchema");

const ResponseHandler = require("./ResponseHandler");

const Utils = require("../utils/Utils");

class UserApi {
    static async get(query = {}, options = { one: false }) {
        const users = await User[(options.one ? "findOne" : "find")](query)
            .populate({
                path: "lists",
                populate: {
                    path: "items",
                    model: "Item"
                }  
            }).populate({
                path: "historyLists",
                populate: {
                    path: "items",
                    model: "Item"
                }  
            });

        if (!users) return null; 

        if (options.one) {
            users.lists = users.lists.sort(Utils.sortByProperty("-createdAt"));
        } else {
            for (let i = 0; i < users.length; i++) {                    
                users[i].lists = users.map(user => user.lists.sort(Utils.sortByProperty("createdAt")));
            }
        }

        return users;
    }

    static async login(pin) {
        if (!pin) throw ResponseHandler.invalidPIN();

        const user = await this.get({ pin: pin }, { one: true });

        if (!user) throw ResponseHandler.loginFailed();

        return user;
    }

    static async valid(pin) {
        if (!pin) throw ResponseHandler.invalidPIN();

        const user = await this.get({ pin: pin }, { one: true });

        // Return true if the user exists, and false if it doesn't
        return !!user;
    }

    static async create(pin = Utils.createPIN()) {
        const user = await User.create({ pin: pin });

        return user;
    }

    static async getStats(pin) {
        return (await User.findOne({ pin })).stats;
    }
}

module.exports = UserApi;