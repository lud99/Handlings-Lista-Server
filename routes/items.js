const express = require("express");

const router = express.Router();

const ItemApi = require("../api/ItemApi");

const ResponseHandler = require("../api/ResponseHandler");

/** 
 * Get list items for the specified user 
 * 
 * @route GET /api/v1/users/lists/items
 * @access Public 
*/
router.get("/", async (req, res) => {
    try {
        const response = await ItemApi.get(req.body.pin, req.body.listId);
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Update the state for a specifid users item
 * 
 * @route GET /api/v1/users/lists/items/update-state?completed=bool
 * @access Public 
*/
router.post("/update-state", async (req, res) => {
    try {
        const response = await ItemApi.updateState(req.body.pin, req.body.itemId, req.query.completed)
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
 * @route POST /api/v1/users/lists/items/create
 * @access Public 
*/
router.post("/create", async (req, res) => {
    try {
        const response = await ItemApi.create(req.body.pin, req.body.text, req.body.listId);
        
        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

/** 
 * Delete an item in a list for the specified user 
 * 
 * @route POST /api/v1/users/lists/items/delete
 * @access Public 
*/
router.post("/delete", async (req, res) => {
    try {
        const response = await ItemApi.delete(req.body.pin, req.body.id, req.body.listId);

        // Handle errors
        if (response.error) throw response.error;

        res.json(response);
    } catch (error) {
        ResponseHandler.routeError(res, error);
    }
});

module.exports = router;