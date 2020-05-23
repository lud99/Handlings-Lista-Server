class ResponseHandler
{
    /**
     * Throw if an error occurred
     * 
     * @param {{}} res - The express response object
     * 
     * @return {{ error: string, stack: string }}
     */
    static apiResponseError(response)
    {
        return response.error || { message: "Internal Server Error" };
    }

    /**
     * Convert errors into objects that can be send
     * 
     * @param {{}} error - The error that occurred
     * 
     * @return {{ error: string, stack: string }}
     */
    static errorToJSON(error)
    {
        // Convert the error to JSON
        const json = JSON.parse(JSON.stringify(error, Object.getOwnPropertyNames(error)));

        // If not in development mode

        if (process.env.NODE_ENV !=="dev")
            delete json.stack; // Remove the stack for safety purposes if not in development mode

        return json;
    }

    /**
     * Handle errors occurring in routes by sending a custom error response to the client
     * 
     * @param {{}} res - The express response object
     * @param {{ message: string, stack: string }} error - The error object
     * @param {*} otherData - Any other data to send
     */
    static routeError(res, error, otherData)
    {
        // Log the error
        console.error(error);

        // 500 - Internal server error
        res.status(500).json({
            success: false,
            error: this.errorToJSON(error),
            otherData
        });
    }

    /**
     * Handle errors occurring in websockets by sending a custom error response to the client
     * 
     * @param {{}} conn - The websocket client conn object
     * @param {{ message: string, stack: string }} error - The error object
     * @param {*} otherData - Any other data to send
     */
    static webSocketError(conn, error, otherData)
    {
        // Log the error
        console.error(error);

        // Send to client
        conn.send(JSON.stringify({
            success: false,
            error: this.errorToJSON(error),
            otherData
        }));
    }

    /**
     * Return the error message for a normal server error
     * 
     * @param {{}} error - The error that occurred
     * 
     * @return {{ success: false, error: {} }} 
     */
    static error(error)
    {
        return { 
            success: false, 
            error: error,
        }; 
    }

    /**
     * Return the error message for a normal server error
     * 
     * @param {{}} data - The data to send
     * @param {*} otherData - Any other data to be send
     * 
     * @return {{ success: true, data: {} }} 
     */
    static success(data, otherData = undefined)
    {
        if (data && data.success)
            return data;
            
        return { 
            success: true, 
            data: data,
            otherData
        }; 
    }

    /**
     * Return the error message for when a pin isn't specified
     * 
     * @param {Number} pin - The invalid pin
     * @param {*} otherData - Any other data to be send
     * 
     * @return {{ success: false, message: "Invalid PIN Specified", }} 
     */
    static invalidPIN(pin = undefined, otherData = undefined)
    {
        return { 
            message: "Invalid PIN Specified",
            pin: pin,
            otherData
        }; 
    }
}

module.exports = ResponseHandler;