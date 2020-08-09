const express = require("express");

const router = express.Router();

const ListApi = require("../api/ListApi");
const List = require("../modules/ListSchema");

const { ListUtils } = require("../api/ApiUtils");

const ResponseHandler = require("../api/ResponseHandler");

/** 
 * Get lists for the specified user
 * 
 * @route GET /api/v1/users/lists
 * @access Public 
*/
router.get("/", async (req, res) => {
    try {
        // Get a specific list
        if (req.body.listId) 
            var response = await ListUtils.getById(req.body.pin, req.body.listId);
        else // Get all the users lists
            var response = await List.find({ userPin: req.body.pin }).populate("items");
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Create a list for the specified user 
 * 
 * @route POST /api/v1/users/lists/create
 * @access Public 
*/
router.post("/create", async (req, res) => {
    try {
        const response = await ListApi.create(req.body.pin, req.body.name, req.body.items);
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Delete a list for the specified user 
 * 
 * @route POST /api/v1/users/lists/delete
 * @access Public 
*/
router.post("/delete", async (req, res) => {
    try {
        const response = await ListApi.delete(req.body.pin, req.body.id);

        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});


module.exports = router;