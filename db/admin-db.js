const db = require("./config");

const getAdminByEmail = async (email) => {

    try {
        let query = await db.pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        return query.rows[0];
    } catch(e) {

    }
}

const checkAdminCredentials = async (email, password) => {

    try {
        let query = await db.pool.query("SELECT (password = crypt($2, password)) AS valid FROM admin WHERE email = $1", [email, password]);
        return query.rows[0].valid;
    } catch(e) {

    }
}

// TODO: to put inside referent-db?
const listNewReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = true ORDER BY id ASC");
        return query.rows;
    } catch(e) {

    }
}

// TODO: to put inside referent-db?
const listOldReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = false ORDER BY id ASC");
        return query.rows;
    } catch(e) {

    }
}

// TODO: to put inside referent-db?
const enableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = true, new = false WHERE id = $1;", [id]);
        console.log(query);
        return query;
    } catch(e) {

    }
}

// TODO: to put inside referent-db?
const disableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = false WHERE id = $1;", [id]);
        return query.rows;
    } catch(e) {

    }
}

module.exports = {
    getAdminByEmail,
    checkAdminCredentials,
    listNewReferents,
    listOldReferents,
    enableReferent,
    disableReferent
};