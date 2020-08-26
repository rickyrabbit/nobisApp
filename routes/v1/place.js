const router = require("express").Router();
const JWT = require('jsonwebtoken');
const tmp = require('tmp-promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { createZip, pdfGraphicalDetails, saveQRImagetoPath, saveQRPDFtoPath } = require('../qrzipcreator');

const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError ,ModuleError, InternalOperationError } = require("../errors");

const db = require("../../db/place-db");
const buildingdb = require("../../db/building-db");
const persondb = require("../../db/person-db");

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/create', wrap(async (req, res, next) => {
    /* if (!validateReferentSession(req, res)) return;

    try {
        return true;
    } catch (err) {
        res.status(401).redirect(`/referent/login`);
        return false;
    } */

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
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
        console.debug(err);
        if (err instanceof InsertError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            //let message = "GotoLogin";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

router.post('/:uuid/update', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let placeUUID = req.params.uuid;
        let result = await db.updatePlace(req.body.placeName, req.body.placeLongitude, req.body.placeLatitude, req.body.placeCapacity, req.body.placeVisitTime, req.body.placeBuilding, req.body.placeCategory, placeUUID);
        if (result) res.sendStatus(200);
    } catch (err) {
        console.debug(err);
        if (err instanceof UpdateError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            //let message = "GotoLogin";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

router.delete('/:uuid', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.deletePlace(req.params.uuid);
        if (result) res.sendStatus(200);
    } catch (err) {
        console.debug(err);
        if (err instanceof DeleteError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

router.post('/:uuid/enable', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.enablePlace(req.params.uuid);
        if (result) res.sendStatus(200);
    } catch (err) {
        console.debug(err);
        if (err instanceof UpdateError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }
}));

router.post('/:uuid/disable', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.disablePlace(req.params.uuid);
        if (result) res.sendStatus(200);
    } catch (err) {
        console.debug(err);
        if (err instanceof UpdateError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

router.post('/:uuid/get', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.getPlaceByUUID(req.params.uuid);
        if (result) res.status(200).json(result);

    } catch (err) {
        console.debug(err);
        if (err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

router.get('/:uuid/qrcodes', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let placeName = await db.getPlaceNameByUUID(req.params.uuid);
        let buildingName = await buildingdb.getBuildingNameByPlaceUUID(req.params.uuid);
        const options = { unsafeCleanup: true };

        let tdc;
        try {
            tdc = await tmp.dir(options);
        } catch (err) {
            let ioe = new InternalOperationError();
            ioe.setReason("TMPDIRCREATIONFAIL");
            throw ioe;
        }

        let tmppath = tdc.path;

        let checkinFilePath =  await saveQRImagetoPath(tmppath, req.params.uuid, "CHECKIN");
        let checkoutFilePath = await saveQRImagetoPath(tmppath, req.params.uuid, "CHECKOUT");


        let pdfGD = pdfGraphicalDetails('public/fonts/Roboto-Medium.ttf',
            'public/img/Logo_Universita_Padova.png',
            'NOBIS',
            'Inquadra il codice QR con la fotocamera per effettuare il Check-Out da  questo luogo',
            placeName,
            buildingName
        );

        //let pdfQR = QRImages(checkinFilePath, checkoutFilePath);
        let pdfFilePath = await saveQRPDFtoPath(tmppath, "printable", pdfGD, checkinFilePath, checkoutFilePath);

        let zipPath = createZip(tmppath,`QRCodes-${placeName}`);

        res.download(zipPath,tdc.cleanup);

        /* res.zip([
            { path: checkinFilePath, name: `check-in.png` },
            { path: checkoutFilePath, name: `check-out.png` },
            { path: pdfFilePath, name: `printable.pdf` }
        ], `QRCodes-${placeName}.zip`, tdc.cleanup); */

    } catch (err) {
        console.debug(err);
        if (err instanceof QueryError || err instanceof InternalOperationError || err instanceof ModuleError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
        //res.sendStatus(500);
    }

}));

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

router.post('/:placeUUID/check-in', wrap(async (req, res, next) => {
    try {
        if (await db.isEnabled(req.params.placeUUID)) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                personUUID = uuidv4();
                persondb.createPerson(personUUID);
                var d = new Date();
                d.setHours(24, 0, 0, 0);
                res.cookie("person_identifier", JWT.sign({ uuid: personUUID }, process.env.PERSON_SECRET), {
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

}));

router.post('/:placeUUID/check-out', wrap(async (req, res, next) => {
    try {
        if (await db.isEnabled(req.params.placeUUID)) {
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
}));

router.post('/:placeUUID/feedback', wrap(async (req, res, next) => {
    try {
        console.log(await db.isEnabled(req.params.placeUUID))
        if (await db.isEnabled(req.params.placeUUID)) {
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
}));

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