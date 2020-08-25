const db = require("./config");
const { QueryError } = require("../routes/errors");

const getAdminByEmail = async (email) => {

    try {
        let query = await db.pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        return query.rows[0];
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

const checkAdminCredentials = async (email, password) => {

    try {
        let query = await db.pool.query("SELECT (password = crypt($2, password)) AS valid FROM admin WHERE email = $1", [email, password]);
        return query.rows[0].valid;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

module.exports = {
    getAdminByEmail,
    checkAdminCredentials
};