const router = require("express").Router();
const JWT = require('jsonwebtoken');

const db = require("../../db/building-db");

router.post('/create', async (req, res) => {

    if (!validateReferentSession(req, res)) return;
    try {
        let result = await db.createBuilding(
            req.body.buildingName, 
            req.body.buildingLongitude, 
            req.body.buildingLatitude, 
            req.body.buildingAddress, 
            req.body.buildingNumber, 
            req.body.buildingProvince
        );
        if (result) res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500);
    }

});

router.delete('/:id', async (req, res) => {
    
    if (!validateReferentSession(req, res)) return;

    try {
        let result = await db.deleteBuilding(req.params.id);
        if (result) res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }

});

function validateReferentSession(req, res) {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        return true;
    } catch (err) {
        res.status(401).redirect(`/referent/login`);
        return false;
    }
}

module.exports = router;