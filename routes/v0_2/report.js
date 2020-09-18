// TODO: Add Error Management

const router = require("express").Router();

// Current API version used
const API_VERSION = process.env.API_VERSION;

// Database
const db = require(`../../db/${API_VERSION}/report-db`);

/**
 * Route that allows to create reports.
 * @name post/create
 * @function
 * @memberof module:routers/report
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/create', async (req, res) => {
    try {
        let query = db.createReport(req.body.problem, req.body.placeUUID);
        if (query)
            res.sendStatus(200);
    } catch (error) {
        console.debug(err);
        res.sendStatus(500);
    }
});

/**
 * Route that allows to resolve a report.
 * @name post/id/resolve
 * @function
 * @memberof module:routers/report
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:id/resolve', async (req, res) => {
    try {
        let result = await db.resolveReport(req.params.id);
        if (result)
            res.sendStatus(200);
    } catch (error) {
        console.debug(err);
        res.sendStatus(500);
    }
});

module.exports = router;