const express = require("express");

const router = express.Router();

const UserApi = require("../api/UserApi");

const ResponseHandler = require("../api/ResponseHandler");

/** 
 * Get all users
 * 
 * @route GET /api/v1/users/all
 * @access Public 
*/

router.get("/all", async (req, res) => {
    try {
        const response = await UserApi.get();
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Get a user by pin
 * 
 * @route GET /api/v1/users
 * @access Public 
*/

router.get("/", async (req, res) => {
    try {
        const pin = parseInt(req.body.pin);
        const response = await UserApi.getByPin(pin);
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Login
 * 
 * @route POST /api/v1/users/login
 * @access Public 
*/

router.post("/login", async (req, res) => {
    try {
        const pin = parseInt(req.body.pin);
        const response = await UserApi.login(pin);
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Create a user
 * 
 * @route POST /api/v1/users/create
 * @access Public 
*/
router.post("/create", async (req, res) => {
    try {
        const response = await UserApi.create();
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

module.exports = router;