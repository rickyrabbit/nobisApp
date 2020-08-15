const db = require("./config");

const checkReferentCredentials = async (email, password) => {
    try {
        let query = await db.pool.query(
            "SELECT id, enable, (password = crypt($2, password)) AS valid FROM referent WHERE email = $1",
            [email, password]
        );
        return query.rows[0];
    } catch(e) {
        console.error(e.stack);
    }
}

const createReferent = async (firstname, lastname, email, password) => {
    try {
        let query = await db.pool.query(
            "INSERT INTO referent (id, firstname, lastname, email, password) VALUES (nextval('referent_id_seq'), $1, $2, $3, crypt($4, gen_salt('bf')));",
            [firstname, lastname, email, password]
        );
        return query;
    } catch(e) {
        console.error(e.stack);
    }
}

const listNewReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = true ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
    }
}

const listOldReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = false ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
    }
}

const enableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = true, new = false WHERE id = $1;", [id]);
        return query;
    } catch(e) {
        console.error(e.stack);
    }
}

const disableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = false WHERE id = $1;", [id]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
    }
}

const getEmailByReferentId = async (id) => {

    try {
        let query = await db.pool.query("SELECT email FROM referent WHERE id = $1;", [id]);
        return query.rows[0].email;
    } catch(e) {
        console.error(e.stack);
    }
}

module.exports = {
    checkReferentCredentials,
    createReferent,
    listNewReferents,
    listOldReferents,
    enableReferent,
    disableReferent,
    getEmailByReferentId
};