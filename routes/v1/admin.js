const router = require("express").Router();
const path = require('path')
const bcrypt = require('bcrypt')
const JWT = require('jsonwebtoken');

const db = require("../../db/config");

router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/admin-login.html'));
});

router.post('/api/login', async (req, res) => {

    console.log("bcrypt comparison started");

    let admin = db.getAdminByEmail(req);

    bcrypt.compare(req.body.password, admin.password, function(err, result) { //req.body.password
            console.log(err);
            console.log(result);
            if(err) {
                console.log("bcrypt comparison failed");
                //handle
            } 
            if (result) {
                let payload = admin.email; //req.body.email
                console.log(process.env.ADMIN_SECRET);
                const token = JWT.sign(payload, process.env.ADMIN_SECRET);
                console.log(token);
                res.cookie("admin_token", token, {
                    maxAge: 3600,
                    httpOnly: true,
                    sameSite: true
                });
                res.status(200).sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));     
            } else {
                console.log("bcrypt: password not valid");
            }
    });
});

router.get('/panel', async (req, res) => {

    const token = req.cookies.admin_token;
    const decoded = JWT.verify(token, process.env.ADMIN_SECRET);

    res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));
});

module.exports = router;