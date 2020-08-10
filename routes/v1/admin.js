const router = require("express").Router();

//const db = require("../db/config");


router.get('/login', async (req, res) => {
    res.send('../../public/html/admin-login.html');
});

router.get('/api/login', async (req, res) => {

    // TODO: SECRET should be an env variable
    const SECRET = "eqflkbjch9143iuc!";
    let payload = "email";
    const token = JWT.token(payload, SECRET);
	res.cookie("admin_token", token, {
        maxAge: 3600,
        httpOnly: true,
        sameSite: true
    });
    res.send('../../public/html/admin-panel.html');
});

router.get('/panel', async (req, res) => {

    const token = req.cookies.admin_token;
    // TODO: SECRET should be an env variable
    const SECRET = "eqflkbjch9143iuc!";
    const decoded = JWT.verify(token, SECRET);

    res.send('../../public/html/admin-panel.html');
});

module.exports = router;