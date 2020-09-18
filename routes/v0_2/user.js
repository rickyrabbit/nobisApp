// TODO: Add Error Management

const router = require("express").Router()

// Errors Management
const { UnAuthenticatedError, InternalServerError, InsertError, DeleteError, UpdateError, QueryError } = require("../errors");

// Current API version used
const API_VERSION = process.env.API_VERSION;

// Database
const userdb = require(`../../db/${API_VERSION}/user-db`);

let wrap = fn => (...args) => fn(...args).catch(args[2]);

/**
 * Route serving User Dashboard.
 * @name get
 * @function
 * @memberof module:routers/user
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
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
        res.sendStatus(500);
    }
});

/**
 * Route that allows to find places given a Bounding Box.
 * @name get/mapInfo/findPlacesinMap
 * @function
 * @memberof module:routers/user
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/mapInfo/findPlacesinMap", async (req, res) => {
    try {
        let xmin = parseFloat(req.query.coorXmin);
        let ymin = parseFloat(req.query.coorYmin);
        let xmax = parseFloat(req.query.coorXmax);
        let ymax = parseFloat(req.query.coorYmax);

        let placesRes = await userdb.getPlacesInMapBoundingBox(xmin, ymin, xmax, ymax);
        if (placesRes) {
            res.status(200).json(placesRes);
        }
    } catch (err) {
        console.debug(err);
        res.sendStatus(500);
    }
});

/**
 * Route that allows to search places given a string.
 * @name get/mapInfo/searchPlaces
 * @function
 * @memberof module:routers/user
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get("/mapInfo/searchPlaces", async (req, res) => {
    try {
        let si = req.query.searchInput;
        let placesRes = await userdb.getPlacesFromSearchPattern(si);
        if (placesRes) {
            res.status(200).json(placesRes);
        }
    } catch (err) {
        console.debug(err);
        res.sendStatus(500);
    }
});

module.exports = router;