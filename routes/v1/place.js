const router = require("express").Router();
const JWT = require('jsonwebtoken');
var QRCode = require('qrcode');
const tmp = require('tmp');
var zip = require('express-zip');
const { v4: uuidv4 } = require('uuid');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const db = require("../../db/place-db");
const buildingdb = require("../../db/building-db");
const persondb = require("../../db/person-db");

router.post('/create', async (req, res) => {

    if (!validateReferentSession(req, res)) return;

    try {
        let refId = JWT.decode(req.cookies.referent_token).id;
        let result = await db.createPlace(
            req.body.placeName, 
            req.body.placeLongitude, 
            req.body.placeLatitude, 
            req.body.placeCapacity, 
            req.body.placeVisitTime, 
            req.body.placeBuilding, 
            req.body.placeCategory, 
            refId
        );
        if (result) res.sendStatus(200)
    } catch (err) {
        res.sendStatus(500);
    }

});

router.post('/:uuid/update', async (req, res) => {

    if (!validateReferentSession(req, res)) return;

    try {
        let placeUUID = req.params.uuid;
        let result = await db.updatePlace(req.body.placeName, req.body.placeLongitude, req.body.placeLatitude, req.body.placeCapacity, req.body.placeVisitTime, req.body.placeBuilding, req.body.placeCategory, placeUUID);
        if (result) res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }

});

router.delete('/:uuid', async (req, res) => {
    
    if (!validateReferentSession(req, res)) return;

    try {
        let result = await db.deletePlace(req.params.uuid);
        if (result) res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
    }

});

router.post('/:uuid/enable', async (req, res) => {

    if (!validateReferentSession(req, res)) return;

    try {
        let result = await db.enablePlace(req.params.uuid);
        if(result) res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }
});

router.post('/:uuid/disable', async (req, res) => {

    if (!validateReferentSession(req, res)) return;
    
    try {
        let result = await db.disablePlace(req.params.uuid);
        if(result) res.sendStatus(200);
    } catch (error) {
        res.sendStatus(500);
    }

});

router.post('/:uuid/get', async (req, res) => {

    if (!validateReferentSession(req, res)) return;
    
    try {
        let result = await db.getPlaceByUUID(req.params.uuid);
        if(result) res.status(200).json(result);

    } catch (error) {
        res.sendStatus(500);
    }

});

router.get('/:uuid/qrcodes', async (req, res) => {
    
    if (!validateReferentSession(req, res)) return;

    try {
        let placeName = await db.getPlaceNameByUUID(req.params.uuid);
        let buildingName = await buildingdb.getBuildingNameByPlaceUUID(req.params.uuid);
        const options = {unsafeCleanup: true};
        tmp.dir(options, function _tempDirCreated(dirErr, path, cleanupCallback) {
            if (dirErr) throw dirErr;
            QRCode.toFile(`${path}/${req.params.uuid}-check-in.png`, `https://nobis.dei.unipd.it/place/check-in?placeUUID=${req.params.uuid}`, {}, function (inErr) {
                if (inErr) throw inErr
                QRCode.toFile(`${path}/${req.params.uuid}-check-out.png`, `https://nobis.dei.unipd.it/place/check-out?placeUUID=${req.params.uuid}`, {}, function (outErr) {
                    if (outErr) throw outErr
                    // TODO: Code refactoring needed 
                    const doc = new PDFDocument();
                    // TODO: Better place for the PDF? Why temporary ${path} doesn't work?
                    let out = fs.createWriteStream(`${path}/printable.pdf`)
                    doc.pipe(out);
                    doc.font('public/fonts/Roboto-Medium.ttf');
                    doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
                    doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
                    doc.fontSize(38).text('CHECK-IN', 72, 320, { align: 'center' });
                    doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
                    doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
                    doc.image(`${path}/${req.params.uuid}-check-in.png`, 213, 460 , { fit: [180, 180] });
                    doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-In in questo luogo', 72, 670, { align: 'center' });
                    doc.addPage();
                    doc.font('public/fonts/Roboto-Medium.ttf');
                    doc.image('public/img/Logo_Universita_Padova.png', 216, 72, { fit: [180, 180] });
                    doc.fontSize(20).text('NOBIS', 72, 275, { align: 'center' });
                    doc.fontSize(38).text('CHECK-OUT', 72, 320, { align: 'center' });
                    doc.fontSize(28).text(placeName, 72, 380, { align: 'center' });
                    doc.fontSize(24).text(buildingName, 72, 410, { align: 'center' });
                    doc.image(`${path}/${req.params.uuid}-check-out.png`, 213, 460 , { fit: [180, 180] });
                    doc.fontSize(20).text('Inquadra il codice QR con la fotocamera per effettuare il Check-Out da  questo luogo', 72, 670, { align: 'center' });
                    doc.end();
                    out.on('finish', function() {
                        res.zip([
                            { path: `${path}/${req.params.uuid}-check-in.png`, name: `check-in.png`},
                            { path: `${path}/${req.params.uuid}-check-out.png`, name: `check-out.png`},
                            { path: `${path}/printable.pdf`, name: `printable.pdf`}
                          ], `QR Codes - ${placeName}`, cleanupCallback);
                          //setTimeout(cleanupCallback, 1000);
                    });
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
    let buildingName = await buildingdb.getBuildingNameByPlaceUUID(placeUUID);

    res.render('check-in', {
        layout: 'check.handlebars',
        pageTitle: 'Check-In',
        placeName: placeName,
        buildingName: buildingName,
        placeUUID: placeUUID
    });

});

router.get('/check-out', async (req, res) => {

    let placeUUID = req.query.placeUUID;
    let placeName = await db.getPlaceNameByUUID(placeUUID);
    let buildingName = await buildingdb.getBuildingNameByPlaceUUID(placeUUID);

    res.render('check-out', {
        layout: 'check.handlebars',
        pageTitle: 'Check-Out',
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
    try {
        if(await db.isEnabled(req.params.placeUUID)) {
            let personUUID;
            if (req.cookies.person_identifier != undefined) {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET);
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
                db.checkOut(personUUID, req.params.placeUUID);
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
        res.sendStatus(500);
    }
});

router.post('/:placeUUID/feedback', async (req, res) => {
    try {
        console.log(await db.isEnabled(req.params.placeUUID))
        if(await db.isEnabled(req.params.placeUUID)) {
            let personUUID;
            if (req.cookies.person_identifier != undefined) {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET);
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
                console.log(req.body);
                db.createFeedback(personUUID, req.params.placeUUID, req.body.feedback);
                res.sendStatus(200);
            } else {
                res.sendStatus(500);
            }
        } else {
            res.sendStatus(404);
        }
    } catch (error) {
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