const router = require("express").Router();
const JWT = require('jsonwebtoken');
const nodemailer = require("nodemailer");

const db = require("../../db/referent-db");
const placedb = require("../../db/place-db");
const categorydb = require("../../db/category-db");
const buildingdb = require("../../db/building-db");

router.get('/login', async (req, res) => {
    res.render('ref-login', {
        layout: 'access.handlebars',
        pageTitle: 'Accesso Referente',
        errorMessage: req.query.error
    });
});

router.get('/register', async (req, res) => {
    res.render('ref-register', {
        layout: 'access.handlebars',
        pageTitle: 'Registrazione Referente'
    });
});

router.get('/dashboard', async (req, res) => {
    try {
        JWT.verify(req.cookies.referent_token, process.env.REFERENT_SECRET);
        let id = JWT.decode(req.cookies.referent_token).id;
        if (db.isReferentEnabled(id)) {
            let places = await placedb.listPlacesByReferentId(id);
            let categories = await categorydb.listCategories();
            let buildings = await buildingdb.listBuildings();
            res.render('ref-dashboard', {
                pageTitle: 'Dashboard Referente',
                loadMap: true,
                css: ['ref-dashboard'],
                places: places,
                categories: categories,
                buildings: buildings
            });
        } else {
            let message = "Account non abilitato, aspetta la mail di conferma attivazione.";
            res.status(401).redirect(`/referent/login?error=${message}`);
        }
    } catch (error) {
        res.status(401).redirect('/referent/login');
    }
});

router.post('/checkCredentials', async (req, res) => {
    try {
        let login = await db.checkReferentCredentials(req.body.email, req.body.password);
        if (login.valid && login.enable) {
            let multiplier = 1;
            if (req.body.remember == "on") 
                multiplier = 24;
            res.cookie("referent_token", JWT.sign({id: login.id}, process.env.REFERENT_SECRET), {
                maxAge: 3600000*multiplier,
                httpOnly: true,
                sameSite: true
            });
            res.redirect('/referent/dashboard');
        } else {
            let message = "Account non abilitato, aspetta la mail di conferma attivazione.";
            res.status(401).redirect(`/referent/login?error=${message}`);
        }
    } catch (err) {
        let message = "Credenziali non valide, per favore riprova.";
        res.status(401).redirect(`/referent/login?error=${message}`);
    }
});

router.post('/create', async (req, res) => {
    try {
        // TODO: email già presente?
        if (await db.createReferent(req.body.firstname, req.body.lastname, req.body.email, req.body.password)) {
            res.redirect('/referent/login');
        } else {
            res.status(500).redirect('/referent/register');
        }
    } catch (err) {
        res.status(500).redirect('/referent/register');
    }
});

router.post('/:id/enable', async (req, res) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        let result = await db.enableReferent(req.params.id);
        if (result) {
            let email = await db.getEmailByReferentId(req.params.id);
            sendMail(
                email, 
                "Referente Abilitato", 
                "Il tuo account da referente è stato abilitato. Puoi ora creare luoghi e ottenere i codici QR per il check-in e check-out."
            );
            res.sendStatus(200);
        }
    } catch (error) {
        res.sendStatus(401);
    }
});

router.post('/:id/disable', async (req, res) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        let result = await db.disableReferent(req.params.id);
        if(result) {
            let email = await db.getEmailByReferentId(req.params.id);
            sendMail(
                email, 
                "Referente Disabilitato", 
                "Il tuo account da referente è stato disabilitato."
            );
            res.sendStatus(200);
        }
    } catch (error) {
        res.sendStatus(401);
    }
});

async function sendMail(email, subject, text) {
    let testAccount = await nodemailer.createTestAccount();

    // TODO: chiedere ed usare credenziali DEI
    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
        },
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: '"Nobis" <nobis@nobis.dei.unipd.it>', // sender address
        to: email, // list of receivers
        subject: subject, // Subject line
        text: text, // plain text body
        html: `<p>${text}</p>`, // html body
    });
}

module.exports = router;