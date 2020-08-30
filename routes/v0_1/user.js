const router = require("express").Router();
const JWT = require('jsonwebtoken');

const { UnAuthenticatedError, InternalServerError, InsertError, DeleteError, UpdateError, QueryError } = require("../errors");

const API_VERSION = process.env.API_VERSION;
const db = require(`../../db/${API_VERSION}/admin-db`);
const referentdb = require(`../../db/${API_VERSION}/referent-db`);


let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.get("/", (req, res) => {
    try {
        res.render('user-dashboard', {
          pageTitle: 'Dashboard Utente',
          loadMap: true,
          css: ['user-dashboard']
        });
        
    } catch (err) {
        console.debug(err);
    }
});


router.get("/", (req, res) => {
    try {
        res.render('user-dashboard', {
          pageTitle: 'Dashboard Utente',
          loadMap: true,
          css: ['user-dashboard']
        });
        
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