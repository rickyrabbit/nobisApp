const router = require("express").Router();
const JWT = require('jsonwebtoken');

const db = require("../../db/admin-db");
const referentdb = require("../../db/referent-db");

router.get('/login', async (req, res) => {
    res.render('admin-login', {
        layout: 'access.handlebars',
        pageTitle: 'Accesso Amministratore'
    });
});

router.get('/panel', async (req, res) => {
    try {
        JWT.verify(req.cookies.admin_token, process.env.ADMIN_SECRET);
        let newRef = await referentdb.listNewReferents();
        let oldRef = await referentdb.listOldReferents();
        res.render('admin-panel', {
            pageTitle: 'Pannello Amministratore',
            newRef: newRef,
            oldRef: oldRef,
            css: ['admin-panel']
        });
    } catch (error) {
        res.status(401).redirect('/admin/login');
    }
});

router.post('/checkCredentials', async (req, res) => {
    try {
        if (await db.checkAdminCredentials(req.body.email, req.body.password)) {
            let multiplier = 1;
            if (req.body.remember == "on") 
                multiplier = 24;
            res.cookie("admin_token", JWT.sign(req.body.email, process.env.ADMIN_SECRET), {
                maxAge: 3600000*multiplier,
                httpOnly: true,
                sameSite: true
            });
            res.redirect('/admin/panel');
        } else {
            res.status(401).redirect('/admin/login');
        }
    } catch (err) {
        res.status(401).redirect('/admin/login');
    }
});

module.exports = router;