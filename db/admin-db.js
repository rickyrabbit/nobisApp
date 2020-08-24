const db = require("./config");
const { queryError } = require("../routes/errors");

const getAdminByEmail = async (email) => {

    try {
        let query = await db.pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        return query.rows[0];
    } catch(e) {
        // log query error
        console.error(e.stack);
        console.error(e.message);
        // throw new query error
        throw queryError();
    }
}

const checkAdminCredentials = async (email, password) => {

    try {
        let query = await db.pool.query("SELECT (password = crypt($2, password)) AS valid FROM admin WHERE email = $1", [email, password]);
        return query.rows[0].valid;
    } catch(e) {
        console.error(e.stack);
        console.error(e.message);
        // throw new query error
        throw queryError();
    }
}

module.exports = {
    getAdminByEmail,
    checkAdminCredentials
};