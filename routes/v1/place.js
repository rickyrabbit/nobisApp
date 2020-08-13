const router = require("express").Router();
const JWT = require('jsonwebtoken');
var QRCode = require('qrcode');
const tmp = require('tmp');
var zip = require('express-zip');
const { v4: uuidv4 } = require('uuid');

const db = require("../../db/place-db");
const persondb = require("../../db/person-db");

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

router.post('/:uuid/update', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
    } catch (err) {
        res.sendStatus(401);
    }
    try {
        let placeUUID = req.params.uuid;
        let result = await db.updatePlace(req.body.placeName, req.body.placeLongitude, req.body.placeLatitude, req.body.placeCapacity, req.body.placeVisitTime, req.body.placeBuilding, req.body.placeCategory, placeUUID);
        if (result)
            res.sendStatus(200);
        else
            res.sendStatus(500);
    } catch (err) {
        res.sendStatus(500);
    }
});

router.delete('/:uuid', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
    } catch (err) {
        res.sendStatus(401);
    }
    try {
        let result = await db.deletePlace(req.params.uuid);
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

router.post('/:uuid/get', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.getPlaceByUUID(req.params.uuid);
        if(result)
            res.status(200).json(result);
    } catch (error) {
        res.sendStatus(401);
    }
});

router.get('/:uuid/qrcodes', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
    } catch (error) {
        res.sendStatus(401);
    }
    try {
        let placeName = await db.getPlaceNameByUUID(req.params.uuid);
        const options = {unsafeCleanup: true};
        tmp.dir(options, function _tempDirCreated(dirErr, path, cleanupCallback) {
            if (dirErr) throw dirErr;
            QRCode.toFile(`${path}/${req.params.uuid}-check-in.png`, `https://nobis.dei.unipd.it/place/check-in?placeUUID=${req.params.uuid}`, {}, function (inErr) {
                if (inErr) throw inErr
                QRCode.toFile(`${path}/${req.params.uuid}-check-out.png`, `https://nobis.dei.unipd.it/place/check-out?placeUUID=${req.params.uuid}`, {}, function (outErr) {
                    if (outErr) throw outErr
                    res.zip([
                        { path: `${path}/${req.params.uuid}-check-in.png`, name: `/${placeName}/check-in.png`,},
                        { path: `${path}/${req.params.uuid}-check-out.png`, name: `/${placeName}/check-out.png`}
                      ], `QR Codes - ${placeName}`);
                    cleanupCallback();
                })
            })
          });
    } catch (error) {
        res.sendStatus(500);
    }
});

router.get('/check-in', async (req, res) => {
    let placeUUID = req.query.placeUUID;
    let placeName = await db.getPlaceNameByUUID(placeUUID);
    let buildingName = await db.getBuildingNameByPlaceUUID(placeUUID);
    res.render('check-in', {
        layout: 'check.handlebars',
        pageTitle: 'Check-In',
        placeName: placeName,
        buildingName: buildingName,
        placeUUID: placeUUID
    });
});

router.post('/:placeUUID/check-in', async (req, res) => {
    try {
        if(await db.isEnabled(req.params.placeUUID)) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                personUUID = uuidv4();
                persondb.createPerson(personUUID);
                var d = new Date();
                d.setHours(24,0,0,0);
                res.cookie("person_identifier", JWT.sign({uuid: personUUID}, process.env.PERSON_SECRET), {
                    expires: d,
                    httpOnly: true,
                    sameSite: true
                });
            } else {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET);
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
            }
            db.checkIn(personUUID, req.params.placeUUID);
        
            res.sendStatus(200);
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.sendStatus(500);
    }

});

router.post('/:placeUUID/check-out', async (req, res) => {

});

module.exports = router;