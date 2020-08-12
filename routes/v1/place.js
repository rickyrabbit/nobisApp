const router = require("express").Router();
const JWT = require('jsonwebtoken');
var QRCode = require('qrcode')
const fs = require('fs')

const db = require("../../db/place-db");

router.post('/create', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let refId = JWT.decode(req.cookies.referent_token).id;
        let result = await db.createPlace(req.body.placeName, req.body.placeLongitude, req.body.placeLatitude, req.body.placeCapacity, req.body.placeVisitTime, req.body.placeBuilding, req.body.placeCategory, refId);
        if (result)
            res.sendStatus(200);
        else
            res.sendStatus(500);
    } catch (err) {
        res.sendStatus(500);
    }
});

router.post('/:uuid/enable', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.enablePlace(req.params.uuid);
        if(result)
            res.sendStatus(200);
    } catch (error) {
        res.sendStatus(401);
    }
});

router.post('/:uuid/disable', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.disablePlace(req.params.uuid);
        if(result)
            res.sendStatus(200);
    } catch (error) {
        res.sendStatus(401);
    }
});

router.get('/:uuid/qrcodes', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        // TODO: delete temp qr or check if exists and do not recreate it
        // TODO: zip with checkout file and download all
        QRCode.toFile(`${__dirname}/tempQR/check-in.png`, `nobis.dei.unipd.it/place/${req.params.uuid}/check-in/`, {}, function (err) {
            if (err) throw err
            const file = `${__dirname}/tempQR/check-in.png`;
            res.download(file);
        })
    } catch (error) {
        res.sendStatus(500);
    }
});

module.exports = router;