const router = require("express").Router();
const path = require('path')
const bcrypt = require('bcrypt')

const saltRounds = 10;

const db = require("../../db/config");


router.get('/login', async (req, res) => {
    res.sendFile(path.join(__dirname, '../../public/html/admin-login.html'));
});

router.get('/api/login', async (req, res) => {

    // TODO: access to DB
    const mail = "m8.avanzi@gmail.com";
    const psw = "abaco";

    bcrypt.compare(req.body.password, psw, function(err, resp) {
        if(err) {
            //handle
        } else if (resp) {
            // TODO: SECRET should be an env variable
            let payload = req.body.email;
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

router.post('/panel', async (req, res) => {

    const token = req.cookies.admin_token;
    // TODO: SECRET should be an env variable
    const SECRET = "eqflkbjch9143iuc!";
    const decoded = JWT.verify(token, process.env.ADMIN_SECRET);

    res.sendFile(path.join(__dirname, '../../public/html/admin-panel.html'));
});

module.exports = router;