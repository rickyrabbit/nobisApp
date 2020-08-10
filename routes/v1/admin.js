const router = require("express").Router();
const path = require('path')
const bcrypt = require('bcrypt')
const bodyParser = require("body-parser");

const db = require("../../db/config");


router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/admin-login.html'));
});

router.post('/api/login', async (req, res) => {

    console.log("bcrypt comparison started");

    // TODO: access to DB
    const mail = "m8.avanzi@gmail.com";
    let hashPsw;

    bcrypt.hash("abaco", 10, function(err, hash) {
        hashPsw = hash;
    });

    console.log(hashPsw);

    bcrypt.compare("abaco", hashPsw, function(err, result) { //req.body.password
        console.log(err);
        console.log(result);
        if(err) {
            console.log("bcrypt comparison failed");
            //handle
        } 
        if (result) {
            let payload = "m8.avanzi@gmail.com"; //req.body.email
            const token = JWT.token(payload, process.env.ADMIN_SECRET);
            console.log(token);
            res.cookie("admin_token", token, {
                maxAge: 3600,
                httpOnly: true,
                sameSite: true
            });
            res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));     
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