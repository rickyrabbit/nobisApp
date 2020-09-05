const router = require("express").Router();

const API_VERSION = process.env.API_VERSION;
const db = require(`../../db/${API_VERSION}/report-db`);

router.post('/create', async (req, res) => {
    try {
        let query = db.createReport(req.body.problem, req.body.placeUUID);
        if (query)
            res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

router.post('/:id/resolve', async (req, res) => {
    try {
        let result = await db.resolveReport(req.params.id);
        if (result)
            res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

module.exports = router;