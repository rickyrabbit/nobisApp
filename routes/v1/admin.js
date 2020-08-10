const router = require("express").Router();
const path = require('path')
const bcrypt = require('bcrypt')
const bodyParser = require("body-parser");

const db = require("../../db/config");


router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/admin-login.html'));
});

router.post('/api/login', async (req, res) => {

    // TODO: access to DB
    const mail = "m8.avanzi@gmail.com";
    const psw = "$2y$10$qk3QI2LPlf1EH6.rou1Q5.PaM4/gqyoUjDQYpIjxWRnzUWnpMK/fm";

    bcrypt.compare("abaco", psw, function(err, resp) { //req.body.password
        if(err) {
            //handle
        } else if (resp) {
            let payload = "m8.avanzi@gmail.com"; //req.body.email
            const token = JWT.token(payload, process.env.ADMIN_SECRET);
            res.cookie("admin_token", token, {
                maxAge: 3600,
                httpOnly: true,
                sameSite: true
            });
            res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));     
        }
    });
});

router.get('/panel', async (req, res) => {

    const token = req.cookies.admin_token;
    const decoded = JWT.verify(token, process.env.ADMIN_SECRET);

    res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));
});

module.exports = router;