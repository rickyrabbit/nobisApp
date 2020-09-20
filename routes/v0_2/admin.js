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

// Errors Management
const { UnAuthenticatedError, InternalServerError, InsertError, DeleteError, UpdateError, QueryError } = require("../errors");

// Current used API version
const API_VERSION = process.env.API_VERSION;

// Databases
const db = require(`../../db/${API_VERSION}/admin-db`);
const referentdb = require(`../../db/${API_VERSION}/referent-db`);

let wrap = fn => (...args) => fn(...args).catch(args[2]);

/**
 * Route serving Admin login form.
 * @name get/login
 * @function
 * @memberof module:routers/admin
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/login', async (req, res) => {
    res.render('admin-login', {
        layout: 'access.handlebars',
        pageTitle: 'Accesso Amministratore',
        errorMessage: req.query.error
    });
});

/**
 * Route serving Admin Panel. (Requires Authentication)
 * @name get/panel
 * @function
 * @memberof module:routers/admin
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.get('/panel', wrap(async (req, res) => {
    try {
        // JWT Verification
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);

        let newRef = await referentdb.listNewReferents();
        let oldRef = await referentdb.listOldReferents();
        res.render('admin-panel', {
            nobisName: "NoBis",
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
 * Route checking Admin Credentials.
 * @name post/checkCredentials
 * @function
 * @memberof module:routers/admin
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/checkCredentials', wrap(async (req, res, next) => {
    try {
        let goodCredentials = await db.checkAdminCredentials(req.body.email, req.body.password);
        if (goodCredentials) {
            let multiplier = 1;
            if (req.body.remember == "on") 
                multiplier = 24;
            // JWT Cookie Generation
            res.cookie("admin_token", JWT.sign(req.body.email, process.env.ADMIN_SECRET), {
                maxAge: 3600000*multiplier,
                httpOnly: true, // Disable access through JS
                sameSite: true // Disable access form other domains
            });
            res.status(200).redirect('/admin/panel');
        } else {
            let ue = new UnAuthenticatedError();
            let message = "WRONGADMINCREDENTIALS";
            ue.setReason(message);
            throw ue;
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
    }
}));

/**
 * General route in case of error.
 * @name use
 * @function
 * @memberof module:routers/admin
 * @inner
 * @param {callback} middleware - Express middleware.
 */
router.use(function (err, req, res, next) {
    if (err instanceof UnAuthenticatedError) {
        res.clearCookie("referent_token");
        res.status(err.statusCode);
        
        if(err.reason == 'JWTERROR'){
            res.redirect('/admin/login');
        }
        else if(err.reason == 'WRONGADMINCREDENTIALS'){
            let message = "Credenziali non valide, per favore riprova.";
            res.redirect(`/admin/login?error=${message}`);
        }
        console.log(`UnAuthenticated Error: error ${err.statusCode}`);
        return;
    }
    else if(err instanceof InternalServerError) {
        res.status(err.statusCode);
        console.log(`Internal server error: error ${err.statusCode}`);
        if(err.reason === "QUERY_ADMINCREDCHECK"){
            res.redirect(`/admin/login`);
        }
        return;
    }
});

module.exports = router;