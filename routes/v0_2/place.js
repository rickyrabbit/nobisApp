/*
 * Copyright 2020 Mattia Avanzi, Riccardo Coniglio
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const router = require("express").Router();
const JWT = require('jsonwebtoken');
const tmp = require('tmp-promise');
const { v4: uuidv4 } = require('uuid');

// Required for QR Code PDF Generation
const { createZip, pdfGraphicalDetails, saveQRImagetoPath, saveQRPDFtoPath } = require('../qrzipcreator');

// Errors Management
const { NotFoundError, UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError, ModuleError, InternalOperationError } = require("../errors");

// Current used API version
const API_VERSION = process.env.API_VERSION;

// Databases
const buildingdb = require(`../../db/${API_VERSION}/building-db`);
const placedb = require(`../../db/${API_VERSION}/place-db`);
const persondb = require(`../../db/${API_VERSION}/person-db`);

let wrap = fn => (...args) => fn(...args).catch(args[2]);

/**
 * Route that allows the creation of places. (Requires Authentication)
 * @name post/create
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/create', wrap(async (req, res, next) => {
    try {
        // JWT Verification
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let referentId = JWT.decode(req.cookies.referent_token).id;
        let result = await placedb.createPlace(
            req.body.placeName,
            req.body.placeLongitude,
            req.body.placeLatitude,
            req.body.placeCapacity,
            req.body.placeVisitTime,
            req.body.placeBuilding,
            req.body.placeCategory,
            referentId
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows the update of places. (Requires Authentication)
 * @name post/uuid/update
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:uuid/update', wrap(async (req, res, next) => {
    try {
        // JWT Verification
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows the deletion of places. (Requires Authentication)
 * @name post/uuid/delete
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.delete('/:uuid', wrap(async (req, res, next) => {
    try {
        // JWT Verification
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that enable the use of places. (Requires Authentication)
 * @name post/uuid/enable
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:uuid/enable', wrap(async (req, res, next) => {
    try {
        // JWT Verification
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that disable the use of places. (Requires Authentication)
 * @name post/uuid/disable
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:uuid/disable', wrap(async (req, res, next) => {
    try {
        // JWT Verification
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that enable the use of places. (Requires Authentication)
 * @name get/uuid/get
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:uuid/get', wrap(async (req, res, next) => {
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows to download place QR Codes. (Requires Authentication)
 * @name get/uuid/qrcodes
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:uuid/qrcodes', wrap(async (req, res, next) => {
    try {
        // JWT Verification
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);

        let placeName = await placedb.getPlaceNameByUUID(req.params.uuid);
        let buildingName = await buildingdb.getBuildingNameByPlaceUUID(req.params.uuid);

        // PDF Generation
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

        let pdfFilePath = await saveQRPDFtoPath(tmppath, "printable", pdfGD, checkinFilePath, checkoutFilePath);

        // control that there are no illegal characters
        let zipFileName = `QRCodes-${placeName}`;
        const regex = /[\\/:"*?<>|]+/;
        zipFileName = zipFileName.replace(regex, '-');
        let zipPath = createZip(tmppath, zipFileName);

        // Download PDF + Singular QR Codes
        res.download(zipPath, () => {
            tdc.cleanup();
        });

    } catch (err) {
        console.debug(err);
        if (err instanceof QueryError || err instanceof InternalOperationError || err instanceof ModuleError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route serving Check-In Page.
 * @name get/check-in
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
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

/**
 * Route serving Check-Out Page.
 * @name get/check-out
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
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

/**
 * Route that allows the Check-In Operation in a place.
 * @name post/uuid/check-in
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:placeUUID/check-in', wrap(async (req, res, next) => {
    try {
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) { // Person UUID Generation
                personUUID = uuidv4();
                let scp = await persondb.createPerson(personUUID); // throws InsertError
                console.debug(`person creation has been successful: ${JSON.stringify(scp)}`);
                var d = new Date();
                d.setHours(24, 0, 0, 0);
                // JWT Cookie Generation
                res.cookie("person_identifier", JWT.sign({ uuid: personUUID }, process.env.PERSON_SECRET), {
                    expires: d, // Expires next midnight
                    httpOnly: true, // Disable access through JS
                    sameSite: true // Disable access form other domains
                });
            } else { // Person UUID exists
                // Let's verify that it has not been changed
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET); // throws JWTErrors
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
            }
            const succCI = await placedb.checkIn(personUUID, req.params.placeUUID); // throws InsertError
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows the Check-Out Operation in a place.
 * @name post/uuid/check-out
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:placeUUID/check-out', wrap(async (req, res, next) => {
    try {
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) { // Person wants to check-out without a UUID
                personUUID = uuidv4();
                let scp = await persondb.createPerson(personUUID); // throws InsertError
                console.debug(`person creation has been successful: ${JSON.stringify(scp)}`);
                var d = new Date();
                d.setHours(24, 0, 0, 0);
                // JWT Cookie Generation
                res.cookie("person_identifier", JWT.sign({ uuid: personUUID }, process.env.PERSON_SECRET), {
                    expires: d, // Expires next midnight
                    httpOnly: true, // Disable access through JS
                    sameSite: true // Disable access form other domains
                });
            } else { // Person UUID exists
                // Let's verify that it has not been changed
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET); // throws JWTErrors
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
            }
            const succCO = await placedb.checkOut(personUUID, req.params.placeUUID); // throws InsertError
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows the insertion of feedback on crowding.
 * @name post/uuid/feedback
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:placeUUID/feedback', wrap(async (req, res, next) => {
    try {
        let isEn = await placedb.isEnabled(req.params.placeUUID); // throws QueryError
        if (isEn) {
            let personUUID;
            if (req.cookies.person_identifier == undefined) {
                res.sendStatus(500);
            } else {
                // Let's verify that Person UUID has not been changed
                JWT.verify(req.cookies.person_identifier, process.env.PERSON_SECRET);
                personUUID = JWT.decode(req.cookies.person_identifier).uuid;
                const succFDBK = await placedb.createFeedback(personUUID, req.params.placeUUID, req.body.feedback);
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that allows the insertion of a place Opening Times. (Requires Authentication)
 * @name post/uuid/openings/replace
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:placeUUID/openings/replace', wrap(async (req, res, next) => {
    try {
        // JWT Verification
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let placeUUID = req.params.placeUUID;
        let intervals = req.body.intervals;
        placedb.replaceIntervals(placeUUID, intervals)
        res.sendStatus(200);
    } catch (err) {
        console.debug(err);
        if (err instanceof InsertError || err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * Route that retrieve the Opening Times of a place. (Requires Authentication)
 * @name post/uuid/openings/get
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/:placeUUID/opening/get', wrap(async (req, res, next) => {
    try {
        // JWT Verification
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await placedb.getOpeningTimeByUUID(req.params.placeUUID);
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
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);        
            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }
        next(err);
    }
}));

/**
 * General route in case of error.
 * @name use
 * @function
 * @memberof module:routers/place
 * @inner
 * @param {callback} middleware - Express middleware.
 */
router.use(function (err, req, res, next) {
    if (err instanceof UnAuthenticatedError) {
        res.clearCookie("referent_token");
        res.status(err.statusCode).redirect(`/referent/login`);
        console.log(`UnAuthenticated Error: error ${err.statusCode}`);
        return;
    }
    if (err instanceof InternalServerError) {
        res.sendStatus(err.statusCode);
        console.log(`Internal server error: error ${err.statusCode}`);
        return;
    }
});

module.exports = router;