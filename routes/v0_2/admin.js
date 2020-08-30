const router = require("express").Router();
const JWT = require('jsonwebtoken');

const { UnAuthenticatedError, InternalServerError, InsertError, DeleteError, UpdateError, QueryError } = require("../errors");

const API_VERSION = process.env.API_VERSION;
const db = require(`../../db/${API_VERSION}/admin-db`);
const referentdb = require(`../../db/${API_VERSION}/referent-db`);

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.get('/login', async (req, res) => {
    res.render('admin-login', {
        layout: 'access.handlebars',
        pageTitle: 'Accesso Amministratore',
        errorMessage: req.query.error
    });
});

router.get('/panel', wrap(async (req, res) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        // TODO: handle these two requests
        let newRef = await referentdb.listNewReferents();
        let oldRef = await referentdb.listOldReferents();
        res.render('admin-panel', {
            pageTitle: 'Pannello Amministratore',
            newRef: newRef,
            oldRef: oldRef,
            css: ['admin-panel']
        });
    } catch (error) {
        console.debug(err);
        if (err instanceof UpdateError ||err instanceof DeleteError || err instanceof InsertError || err instanceof QueryError ){
            let ise = new InternalServerError();
            if(err.reason !== ""){
                ise.setReason(err.reason);
            }
            next(ise);
        }else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            //let message = "GotoLogin";
            unauth.setReason(message);
            next(unauth);
        }
        /* res.status(401).redirect('/admin/login'); */
        
    
        next(err);
    }
}));

router.post('/checkCredentials', wrap(async (req, res, next) => {
    try {
        let goodCredentials = await db.checkAdminCredentials(req.body.email, req.body.password);
        if (goodCredentials) {
            let multiplier = 1;
            if (req.body.remember == "on") 
                multiplier = 24;
            res.cookie("admin_token", JWT.sign(req.body.email, process.env.ADMIN_SECRET), {
                maxAge: 3600000*multiplier,
                httpOnly: true,
                sameSite: true
            });
            res.status(200).redirect('/admin/panel');
        } else {
            let ue = new UnAuthenticatedError();
            console.debug(`siamo qui hahaahaahaha`);
            let message2 = "Credenziali non valide, per favore riprova.";
            let message = "WRONGADMINCREDENTIALS";
            ue.setReason(message);
            throw ue;
            /* let message = "Credenziali non valide, per favore riprova.";
            res.status(401).redirect(`/admin/login?error=${message}`); */
        }
    } catch (err) {
        if (err instanceof QueryError) {
            let ise = new InternalServerError();
            if(err.reason !== ""){
                ise.setReason(err.reason);
            }
            next(ise);
        }
        next(err);
        /* let message = "Credenziali non valide, per favore riprova.";
        res.status(401).redirect(`/admin/login?error=${message}`); */
    }
}));

router.use(function (err, req, res, next) {
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
});

module.exports = router;