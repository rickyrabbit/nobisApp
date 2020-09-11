const router = require("express").Router();
const JWT = require('jsonwebtoken');
const tmp = require('tmp-promise');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');

const { createZip, pdfGraphicalDetails, saveQRImagetoPath, saveQRPDFtoPath } = require('../qrzipcreator');

const { NotFoundError, UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError, ModuleError, InternalOperationError } = require("../errors");

const API_VERSION = process.env.API_VERSION;
const buildingdb = require(`../../db/${API_VERSION}/building-db`);
const placedb = require(`../../db/${API_VERSION}/place-db`);
const persondb = require(`../../db/${API_VERSION}/person-db`);

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
        let result = await placedb.createPlace(
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

        next(err);
        
    }

}));

router.post('/:uuid/update', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let placeUUID = req.params.uuid;
        let result = await placedb.updatePlace(req.body.placeName, req.body.placeLongitude, req.body.placeLatitude, req.body.placeCapacity, req.body.placeVisitTime, req.body.placeBuilding, req.body.placeCategory, placeUUID);
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

        next(err);
        
    }

}));

router.delete('/:uuid', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await placedb.deletePlace(req.params.uuid);
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

        next(err);
        
    }

}));

router.post('/:uuid/enable', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await placedb.enablePlace(req.params.uuid);
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

        next(err);
        
    }
}));

router.post('/:uuid/disable', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await placedb.disablePlace(req.params.uuid);
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

        next(err);
        
    }

}));

router.post('/:uuid/get', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await placedb.getPlaceByUUID(req.params.uuid);
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

        next(err);
        
    }

}));

router.get('/:uuid/qrcodes', wrap(async (req, res, next) => {

    //if (!validateReferentSession(req, res)) return;

    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let placeName = await placedb.getPlaceNameByUUID(req.params.uuid);
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

        let checkinFilePath = await saveQRImagetoPath(tmppath, req.params.uuid, "CHECKIN");
        let checkoutFilePath = await saveQRImagetoPath(tmppath, req.params.uuid, "CHECKOUT");


        let pdfGD = pdfGraphicalDetails('public/fonts/Roboto-Medium.ttf',
            'public/img/logo_unipd_dei.png',
            'NoBis',
            'Inquadra il codice QR con la fotocamera per effettuare il Check-XXXXX da questo luogo',
            placeName,
            buildingName
        );

        //let pdfQR = QRImages(checkinFilePath, checkoutFilePath);
        let pdfFilePath = await saveQRPDFtoPath(tmppath, "printable", pdfGD, checkinFilePath, checkoutFilePath);

        // control that there are no illegal characters
        let zipFileName = `QRCodes-${placeName}`;
        const regex = /[\\/:"*?<>|]+/;
        zipFileName = zipFileName.replace(regex, '-');
        let zipPath = createZip(tmppath, zipFileName);

        res.download(zipPath, () => {
            tdc.cleanup();
        });
        console.log(`dopo download in teoria`);
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

        next(err);
        
    }

}));

router.get('/check-in', async (req, res) => {

    let placeUUID = req.query.placeUUID;
    let placeName = await placedb.getPlaceNameByUUID(placeUUID);
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
    let placeName = await placedb.getPlaceNameByUUID(placeUUID);
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
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                personUUID = uuidv4();
                persondb.createPerson(personUUID); // throws InsertError
                var d = new Date();
                d.setHours(24, 0, 0, 0);
                res.cookie("person_identifier", JWT.sign({ uuid: personUUID }, process.env.PERSON_SECRET), {
                    expires: d,
                    httpOnly: true,
                    sameSite: true
                });
            } else {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET); // throws JWTErrors
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
            }
            const succCI = placedb.checkIn(personUUID, req.params.placeUUID); // throws InsertError
            if (succCI) {
                // successfull checkin
                // handled via ajax
                res.sendStatus(200);
            } else {
                // UNsuccessfull checkin
                // handled via ajax
                res.sendStatus(500);
            }
        } else {
            // TODO: handle 404 
            let nf = new NotFoundError();
            nf.setReason(`Place NOT enabled: UUID:${req.params.placeUUID}`);
            throw nf;
        }
    } catch (err) {
        console.debug(err);
        if (err instanceof InsertError || err instanceof QueryError) {
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

        next(err);


    }
}));

router.post('/:placeUUID/check-out', wrap(async (req, res, next) => {
    try {
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                personUUID = uuidv4();
                persondb.createPerson(personUUID); // throws InsertError
                var d = new Date();
                d.setHours(24, 0, 0, 0);
                res.cookie("person_identifier", JWT.sign({ uuid: personUUID }, process.env.PERSON_SECRET), {
                    expires: d,
                    httpOnly: true,
                    sameSite: true
                });
            } else {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET); // throws JWTErrors
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
            }
            const succCO = placedb.checkOut(personUUID, req.params.placeUUID); // throws InsertError
            if (succCO) {
                // successfull checkout
                // handled via ajax
                res.sendStatus(200);
            } else {
                // UNsuccessfull checkout
                // handled via ajax
                let ise = new InternalServerError();
                ise.setReason(`Unsuccessful Checkout`);
                throw ise;
            }
        } else {
            // place not enabled
            // TODO: handle 404 
            let nf = new NotFoundError();
            nf.setReason(`Place NOT enabled: UUID:${req.params.placeUUID}`);
            throw nf;
        }
    } catch (err) {
        console.debug(err);
        if (err instanceof InsertError || err instanceof QueryError) {
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

        next(err);


    }
}));

router.post('/:placeUUID/feedback', wrap(async (req, res, next) => {
    try {
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                res.sendStatus(500);
            }else {
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET);
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
                console.log(req.body);
                const succFDBK = placedb.createFeedback(personUUID, req.params.placeUUID, req.body.feedback);
                if (succFDBK) {
                    // successfull feedback
                    // handled via ajax
                    res.sendStatus(200);
                } else {
                    // UNsuccessfull feedback
                    // handled via ajax
                    let ise = new InternalServerError();
                    ise.setReason(`Unsuccessful Feedback`);
                    throw ise;
                }
            }
        } else {
            // place not enabled
            // TODO: handle 404 
            let nf = new NotFoundError();
            nf.setReason(`Place NOT enabled: UUID:${req.params.placeUUID}`);
            throw nf;
        }
    } catch (err) {
        console.debug(err);
        if (err instanceof InsertError || err instanceof QueryError) {
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

        next(err);


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

router.use(function (err, req, res, next) {
    if (err instanceof UnAuthenticatedError) {
        console.log(`arriva qui?UnAuthenticatedError`);
        res.clearCookie("referent_token");
        res.status(err.statusCode).redirect(`/referent/login`);
        console.log(`UnAuthenticated Error: error ${err.statusCode}`);
        return;
    }
    if (err instanceof InternalServerError) {
        res.sendStatus(err.statusCode);
        console.log(`arriva qui?InternalServerError`);
        console.log(`Internal server error: error ${err.statusCode}`);
        return;
    }
});

module.exports = router;