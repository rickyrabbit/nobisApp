const router = require("express").Router()

const { UnAuthenticatedError, InternalServerError, InsertError, DeleteError, UpdateError, QueryError } = require("../errors");

const API_VERSION = process.env.API_VERSION;
const userdb = require(`../../db/${API_VERSION}/user-db`);
//const referentdb = require(`../../db/${API_VERSION}/referent-db`);

/* const initMapBounds = {
    "xmin":11.893279552459717,
    "ymin":45.40348212463429,
    "xmax":11.894717216491701,
    "ymax":45.41252078631575
} */

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.get("/", async (req, res) => {
    try {

        res.render('user-dashboard', {
            nobisName: "NoBis",
            pageTitle: 'Dashboard Utente',
            loadMap: true,
            css: ['user-dashboard']
        });

    } catch (err) {
        console.debug(err);
    }
});


router.get("/mapInfo/findPlacesinMap", async (req, res) => {
    try {
        let xmin = parseFloat(req.query.coorXmin);
        let ymin = parseFloat(req.query.coorYmin);
        let xmax = parseFloat(req.query.coorXmax);
        let ymax = parseFloat(req.query.coorYmax);

        /*
        let xmin = req.query.coorXmin;
        let ymin = req.query.coorYmin;
        let xmax = req.query.coorXmax;
        let ymax = req.query.coorYmax;
        */

        //console.debug(`log xmin: ${xmin}`);
        //console.debug(`log ymin: ${ymin}`);
        //console.debug(`log xmax: ${xmax}`);
        //console.debug(`log ymax: ${ymax}`);

        let placesRes = await userdb.getPlacesInMapBoundingBox(xmin, ymin, xmax, ymax);
        if (placesRes) {
            //console.log(placesRes);
            res.status(200).json(placesRes);
        }

    } catch (err) {
        console.debug(err);
    }
});

router.get("/mapInfo/searchPlaces", async (req, res) => {
    try {
        let si = req.query.searchInput;

        //console.debug(`log si: ${si}`);

        let placesRes = await userdb.getPlacesFromSearchPattern(si);
        if (placesRes) {
            //console.log(placesRes);
            res.status(200).json(placesRes);
        }

    } catch (err) {
        console.debug(err);
    }
});

/* router.use(function (err, req, res, next) {
    if (err instanceof UnAuthenticatedError) {
        console.log(`arriva qui?UnAuthenticatedError`);
        res.clearCookie("referent_token");
        res.status(err.statusCode);
        
        if(err.reason == 'JWTERROR'){
            res.redirect('/admin/login');
        }
        else if(err.reason == 'WRONGADMINCREDENTIALS'){
            let message2 = "Credenziali non valide, per favore riprova.";
            res.redirect(`/admin/login?error=${message2}`);
        }
        console.log(`UnAuthenticated Error: error ${err.statusCode}`);
        return;
    }
    else if(err instanceof InternalServerError) {
        res.status(err.statusCode);
        console.log(`arriva qui?InternalServerError`);
        console.log(`Internal server error: error ${err.statusCode}`);
        // err coming from checkAdminCredentials
        if(err.reason === "QUERY_ADMINCREDCHECK"){
            res.redirect(`/admin/login`);
        }
        //res.redirect(`/admin/login`);
        return;
    }
}); */

module.exports = router;