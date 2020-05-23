const User = require("../modules/UserSchema");

const ResponseHandler = require("./ResponseHandler");

const ListApi = require("./ListApi");

const Utils = require("../utils/Utils");

class UserApi {
    static async get(query = {}, options = { one: false }) {
        try {
            const users = await User[(options.one ? "findOne" : "find")](query)
                .populate({
                    path: "lists",
                    populate: {
                        path: "items",
                        model: "Item"
                    }  
                });

            if (options.one) {
                users.lists = users.lists.sort(Utils.sortByProperty("-createdAt"));
            } else {
                for (let i = 0; i < users.length; i++) {
                    
                    users[i].lists = map(user => user.lists.sort(Utils.sortByProperty("createdAt")));
                }
            }

            return ResponseHandler.success(users);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async getByPin(pin) {
        try {
            if (!pin) throw ResponseHandler.invalidPIN();

            const { data } = await this.get({ pin: pin }, { one: true });

            return ResponseHandler.success(data);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async login(pin) {
        try {
            if (!pin) throw ResponseHandler.invalidPIN();

            const userData = (await this.get({ pin: pin }, { one: true })).data;

            if (!userData) throw { message: "Login failed. Invalid PIN Specified" }

            return ResponseHandler.success(userData);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    
    static async valid(pin) {
        try {
            if (!pin) throw ResponseHandler.invalidPIN();

            const user = (await this.get({ pin: pin }, { one: true })).data;

            if (user)
                return ResponseHandler.success(); 
            else 
                return ResponseHandler.error();
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }

    static async create(pin = Utils.createPIN()) {
        try {
            const user = await User.create({ pin: pin });

            if (webSocketLogLevel == WebSocketLogLevels.Full)
                console.log("Successfully created the user '%s'", user.pin);

            return ResponseHandler.success(user);
        } catch (error) {
            return ResponseHandler.error(error);
        }
    }
}

module.exports = UserApi;