const router = require("express").Router();
//const router = require('express-promise-router');
const path = require('path')
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken');

const db = require("../../db/config");

router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/admin-login.html'));
});

router.post('/api/login', async (req, res) => {

    console.log("bcrypt comparison started");

    //let admin = db.getAdminByEmail(req);
    const admin_row = await db.query('SELECT * FROM admin WHERE email = $1', [req.body.email]);

    console.log(req.body.password);
    console.log(admin_row.password);

    admin_row.then(
        function(res) {console.log(res);}
        ):

    bcrypt.compare(req.body.password, admin_row.password, function(err, result) { 
            console.log(err);
            console.log(result);
            if(err) {
                console.log("bcrypt comparison failed");
                //handle
            } 
            if (result) {
                let payload = admin_row.email; //req.body.email
                console.log(process.env.ADMIN_SECRET);
                const token = JWT.sign(payload, process.env.ADMIN_SECRET);
                console.log(token);
                res.cookie("admin_token", token, {
                    maxAge: 3600,
                    httpOnly: true,
                    sameSite: true
                });
                res.redirect(200, '/admin/panel')
                //res.status(200).sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));     
            } else {
                console.log("bcrypt: password not valid");
            }
    });
});

router.get('/panel', async (req, res) => {

    const admin_token = req.cookies.admin_token;
    console.log(admin_token);;
    const decoded = JWT.verify(admin_token, process.env.ADMIN_SECRET);

    console.log("decoded "+decoded)
    res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));
});

module.exports = router;