const router = require("express").Router();

const db = require("../../db/report-db");

router.post('/create', async (req, res) => {
    try {
        let query = db.createReport(req.body.email, req.body.problem, req.body.placeUUID);
        if (query)
            res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

module.exports = router;