const router = require("express").Router();
const JWT = require('jsonwebtoken');

// Errors Management
const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError ,ModuleError, InternalOperationError } = require("../errors");

// Current used API version
const API_VERSION = process.env.API_VERSION;

// Databases
const db = require(`../../db/${API_VERSION}/building-db`);

let wrap = fn => (...args) => fn(...args).catch(args[2]);

/**
 * Route that allows the creation of buildings. (Requires Authentication)
 * @name post/create
 * @function
 * @memberof module:routers/building
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/create', wrap(async (req, res, next) => {
    try {
        // JWT Verification: may throw JWT.TokenExpiredError / JWT.JsonWebTokenError / JWT.NotBeforeError
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.createBuilding(
            req.body.buildingName,
            req.body.buildingLongitude,
            req.body.buildingLatitude,
            req.body.buildingAddress,
            req.body.buildingNumber,
            req.body.buildingProvince
        );
        console.debug(`Result Print: ${result}`);

        if (result) res.sendStatus(200);

    } catch (err) {
        console.debug(err);
        if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            next(unauth);
        }
        if (err instanceof InsertError) {
            let ise = new InternalServerError();
            next(ise);
        }
        next(err);
    }
}));

/**
 * Route that allows the deletion of buildings. (Requires Authentication)
 * @name delete/id
 * @function
 * @memberof module:routers/building
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.delete('/:id', wrap(async (req, res, next) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        //throw new JWT.JsonWebTokenError("prova");
        let result = await db.deleteBuilding(req.params.id);
        if (result) res.sendStatus(200);
    } catch (err) {
        if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with JWT verify
            console.log(`JWT token not valid, error: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            next(unauth);
        }
        if (err instanceof DeleteError) {
            let ise = new InternalServerError();
            next(ise);
        }
        next(err);
    }
}));

/**
 * General route in case of error.
 * @name use
 * @function
 * @memberof module:routers/building
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