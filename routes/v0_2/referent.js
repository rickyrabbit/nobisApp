const router = require("express").Router();
const JWT = require('jsonwebtoken');
const nodemailer = require("nodemailer");
const assert = require('assert');

const API_VERSION = process.env.API_VERSION;
const db = require(`../../db/${API_VERSION}/referent-db`);
const placedb = require(`../../db/${API_VERSION}/place-db`);
const categorydb = require(`../../db/${API_VERSION}/category-db`);
const buildingdb = require(`../../db/${API_VERSION}/building-db`);
const reportdb = require(`../../db/${API_VERSION}/report-db`);

const { UnAuthenticatedError, QueryError, InsertError, UpdateError, DeleteError, InternalServerError ,ModuleError, InternalOperationError } = require("../errors");
const adminDb = require("../../db/v0_2/admin-db");

let wrap = fn => (...args) => fn(...args).catch(args[2]);

router.get('/login', async (req, res) => {
    res.render('ref-login', {
        layout: 'access.handlebars',
        pageTitle: 'Accesso Referente',
        errorMessage: req.query.error,
        successMessage: req.query.successMessage
    });
});

router.get('/register', async (req, res) => {
    res.render('ref-register', {
        layout: 'access.handlebars',
        pageTitle: 'Registrazione Referente',
        errorMessage: req.query.error
    });
});

router.get('/restore-password', async (req, res) => {
    res.render('restore-password', {
        layout: 'access.handlebars',
        pageTitle: 'Ripristino Password'
    });
});

router.post('/restorePassword', wrap(async (req, res, next) => {
    try {

        let email = req.body.email;
        let ref = await db.getReferentByEmail(email);

        let payload = {
            id: ref.id,
            email: email
        };
        
        let secret = ref.password;

        let token = JWT.sign(payload, secret);

        console.log(token);

        // TODO: Better send mail with HTML
        sendMail(
            email,
            "Ripristino Password Referente",
            `Per ripristinare la password vai al seguente link: ${process.env.APP_DOMAIN}/referent/restore-password-auth/${ref.id}/${token}`
        );

        res.render('restore-password', {
            layout: 'access.handlebars',
            pageTitle: 'Ripristino Password',
            successMessage: 'Riceverai presto una mail con il link per procedere al ripristino della password.'
        });

        return;
    } catch (err) {
        if (err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
        next(err);
    }
}));

router.get('/restore-password-auth/:id/:token', async (req, res) => {
    try {
        let refId = req.params.id;
        let token = req.params.token;
        
        let email = await db.getEmailByReferentId(refId);
        let ref = await db.getReferentByEmail(email);

        let secret = ref.password;
        let payload = JWT.decode(token, secret);

        assert(email == payload.email);

        res.render('restore-password-auth', {
            layout: 'access.handlebars',
            pageTitle: 'Ripristino Password',
            refId: refId,
            token: token,
            email: email
        });

    } catch (error) {
        if (err instanceof QueryError || err instanceof assert.AssertionError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
    }
});

router.post('/changePassword/', wrap(async (req, res, next) => {
    try {

        let refId = req.body.refid;
        let token = req.body.token;

        let newPassword = req.body.password;
        let email = await db.getEmailByReferentId(refId);

        let ref = await db.getReferentByEmail(email);

        let secret = ref.password;
        let payload = JWT.decode(token, secret);

        assert(email == payload.email);

        let updateResult = await db.updatePassword(refId, newPassword);
        
        if(updateResult) {
            let message = "Effettua il login con la nuova password da te scelta."
            res.status(200).redirect(`/referent/login?successMessage=${message}`);
        }

        return;
    } catch (err) {
        if (err instanceof QueryError || err instanceof assert.AssertionError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
        next(err);
    }
}));

router.get('/dashboard', wrap(async (req, res, next) => {
    try {
        //throw new JWT.JsonWebTokenError();
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let id = JWT.decode(req.cookies.referent_token).id;
        let refenabled = await db.isReferentEnabled(id);
        if (refenabled) {
            // const [places, categories, buildings, reports] = await Promise.allSettled([
            //     placedb.listPlacesByReferentId(id),
            //     categorydb.listCategories(),
            //     buildingdb.listBuildings(),
            //     reportdb.listReports(id)
            // ]);
            let places = await placedb.listPlacesByReferentId(id);
            let categories = await categorydb.listCategories();
            let buildings = await buildingdb.listBuildings();
            let reports = await reportdb.listReports(id);
            res.render('ref-dashboard', {
                pageTitle: 'Dashboard Referente',
                loadMap: true,
                css: ['ref-dashboard'],
                places: places,
                categories: categories,
                buildings: buildings,
                reports: reports,
                isReferent: true
            });

        } else {
            let unauth = new UnAuthenticatedError();
            let message2 = "Account non abilitato, aspetta la mail di conferma attivazione.";
            let message = "REFNOTENABLED";
            unauth.setReason(message);
            throw unauth;
            /* let message = "Account non abilitato, aspetta la mail di conferma attivazione.";
            res.status(401).redirect(`/referent/login?error=${message}`); */
        }
    } catch (err) {
        console.debug(err);
        //console.debug(JSON.stringify(typeof err));
        /* if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError){
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            //let message = "GotoLogin";
            unauth.setReason(message);
            next(unauth);
        } */
        if (err instanceof UpdateError || err instanceof DeleteError || err instanceof InsertError || err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
        if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError){
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);
            console.log(`ekrjbglaevlebvlaeb: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            //let message = "GotoLogin";
            unauth.setReason(message);
            next(unauth);
        }
        console.log(`vediamo la prova ${err instanceof JWT.JsonWebTokenError}`);
        /* res.status(401).redirect('/referent/login');
        next(err); */

        next(err);
    }
}));

router.post('/checkCredentials', wrap(async (req, res, next) => {
    try {
        let login = await db.checkReferentCredentials(req.body.email, req.body.password);
        if (login.valid && login.enable) {
            let multiplier = 1;
            if (req.body.remember == "on")
                multiplier = 24;
            res.cookie("referent_token", JWT.sign({ id: login.id }, process.env.REFERENT_SECRET), {
                maxAge: 3600000 * multiplier,
                httpOnly: true,
                sameSite: true
            });
            res.redirect('/referent/dashboard');
            console.debug('arrivi qui?sdfsdfsdfsdf');
        } else if (login.valid && !login.enable) {
            // login isn't  enabled
            console.log("NOT login.enable");
            let ue = new UnAuthenticatedError();
            let message2 = "Account non abilitato, aspetta la mail di conferma attivazione.";
            let message = "REFNOTENABLED";
            ue.setReason(message);
            next(ue);
        } else if (!login.valid) {
            // login isn't valid 
            console.log("NOT login.valid");
            let ue = new UnAuthenticatedError();
            let message2 = "Credenziali non valide, per favore riprova.";
            let message = "WRONGREFCREDENTIALS";
            ue.setReason(message);
            next(ue);
        }
        return;
    } catch (err) {
        if (err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
        next(err);
    }
}));

router.post('/create', wrap(async (req, res, next) => {
    try {
        let emailPresent = await db.checkEmailPresence(req.body.email);
        let emails = await adminDb.getAdminsEmails();
        if(!emailPresent){
            if (await db.createReferent(req.body.firstname, req.body.lastname, req.body.email, req.body.password)) {
                sendMail(
                    emails,
                    "Nuovo Referente da Abilitare",
                    "Abilitalo al seguente link nobis.dei.unipd.it/admin/login"
                );
                res.redirect('/referent/login');
            } else {
                let ise = new InternalServerError();
                ise.setReason("REFNOTCREATED");
                throw ise;
            }
        } else {
            let ie = new InsertError();
            ie.setReason("REFALREADYEXISTING");
            throw ie;
        }
    } catch (err) {
        // createReferent - database query mulfunction
        if (err instanceof InsertError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        }
        // Internal Server Exception - Referent is not created
        next(err);
    }
}));

router.post('/:id/enable', wrap(async (req, res, next) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        let result = await db.enableReferent(req.params.id);
        if (result) {
            let email = await db.getEmailByReferentId(req.params.id);
            sendMail(
                email,
                "Referente Abilitato",
                "Il tuo account da referente è stato abilitato. Puoi ora creare luoghi e ottenere i codici QR per il check-in e check-out. nobis.dei.unipd.it/referent/login"
            );
            res.sendStatus(200);
        }
    } catch (err) {
        console.debug(err);
        if (err instanceof UpdateError || err instanceof DeleteError || err instanceof InsertError || err instanceof QueryError) {
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
        /* res.sendStatus(401); */
    }
}));

router.post('/:id/disable', wrap(async (req, res, next) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        let result = await db.disableReferent(req.params.id);
        if (result) {
            let email = await db.getEmailByReferentId(req.params.id);
            sendMail(
                email,
                "Referente Disabilitato",
                "Il tuo account da referente è stato disabilitato."
            );
            res.sendStatus(200);
        }
    } catch (err) {
        console.debug(err);
        if (err instanceof UpdateError || err instanceof DeleteError || err instanceof InsertError || err instanceof QueryError) {
            let ise = new InternalServerError();
            if (err.reason !== "") {
                ise.setReason(err.reason);
            }
            next(ise);
        } else if (err instanceof JWT.TokenExpiredError || err instanceof JWT.JsonWebTokenError || err instanceof JWT.NotBeforeError) {
            // Problems with jwt verify
            console.log(`problems with jwt token, error: ${err.name}`);

            let unauth = new UnAuthenticatedError();
            let message = "JWTERROR";
            unauth.setReason(message);
            next(unauth);
        }

        next(err);
    }/* res.sendStatus(401); */
}));

async function sendMail(email, subject, text) {

    // send mail with defined transport object
    try {
        //let testAccount = await nodemailer.createTestAccount();
        // TODO: chiedere ed usare credenziali DEI
        // TODO: must be reusable
        let transporter = nodemailer.createTransport({
            host: "mail.dei.unipd.it",
            port: 25,
            secure: false // true for 465, false for other ports,
        });
        let info = await transporter.sendMail({
            from: '"Nobis" <nobis@dei.unipd.it>', // sender address
            to: email, // list of receivers
            subject: subject, // Subject line
            text: text, // plain text body
            html: `<p>${text}</p>`, // html body
        });
    } catch (error) {
        console.log(error);
    }
}


router.use(function (err, req, res, next) {
    if (err instanceof UnAuthenticatedError) {
        console.log(`arriva qui?UnAuthenticatedError`);
        res.clearCookie("referent_token");
        res.status(err.statusCode);
        if (err.reason == 'REFNOTENABLED') {
            let message2 = "Account non abilitato, aspetta la mail di conferma attivazione.";
            res.redirect(`/referent/login?error=${message2}`);
        }
        else if (err.reason == 'JWTERROR') {
            console.debug('quiiiiiiiiiii');
            res.redirect('/referent/login');
        }
        else if (err.reason == 'WRONGREFCREDENTIALS') {
            let message2 = "Credenziali non valide, per favore riprova.";
            res.redirect(`/referent/login?error=${message2}`);
        }
        res.end();
        console.log(`UnAuthenticated Error: error ${err.statusCode}`);

    }
    else if (err instanceof InternalServerError) {
        res.status(err.statusCode);
        console.log(`arriva qui?InternalServerError`);
        console.log(`Internal server error: error ${err.statusCode}`);
        if (err.reason == 'CREATEREF' || err.reason == 'REFNOTCREATED') {
            res.redirect(`/referent/register`);
            return;
        }
        if (err.reason == 'REFALREADYEXISTING') {
            let message = "Email già presente, se non ricordi la password ripristinala alla pagina di login.";
            res.redirect(`/referent/register?error=${message}`);
            return;
        }
        if (err.reason == 'CHECKREFCREDENTIALS') {
            let message = "Validazione non riuscita, per favore riprova.";
            res.redirect(`/referent/login?error=${message}`);
            return;
        }
        return;
    }
});

module.exports = router;