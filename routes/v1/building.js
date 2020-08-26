const router = require("express").Router();
const JWT = require('jsonwebtoken');
const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError ,ModuleError, InternalOperationError } = require("../errors");

const db = require("../../db/building-db");

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.post('/create', wrap(async (req, res, next) => {
    try {
        // May throw JWT.TokenExpiredError / JWT.JsonWebTokenError / JWT.NotBeforeError
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let result = await db.createBuilding(
            req.body.buildingName,
            req.body.buildingLongitude,
            req.body.buildingLatitude,
            req.body.buildingAddress,
            req.body.buildingNumber,
            req.body.buildingProvince
        );
        console.debug(`stampa di result: ${result}`);
        if (result) res.sendStatus(200);

    } catch (err) {
        /* console.group(`Error`);
        console.debug(`error message:${err.message}`);
        console.debug(`error name:${err.name}`);
        console.debug(`error stack:${err.stack}`);
        console.debug(`error is:${err}`);
        console.debug(`error isinstanceof InsertError?:${err instanceof InsertError}`);
        console.groupEnd(`Error`); */
        console.debug(err);
        if (err instanceof InsertError) {
            let ise = new InternalServerError();
            next(ise);
        }
        next(err);
    }


}));

router.delete('/:id', wrap(async (req, res, next) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        //throw new JWT.JsonWebTokenError("prova");
        let result = await db.deleteBuilding(req.params.id);
        if (result) res.sendStatus(200);
    } catch (err) {
        //console.debug(err);
        if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

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