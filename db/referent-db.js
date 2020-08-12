const db = require("./config");

const checkReferentCredentials = async (email, password) => {
    try {
        let query = await db.pool.query(
            "SELECT id, (password = crypt($2, password)) AS valid FROM referent WHERE email = $1",
            [email, password]
        );
        return query.rows[0];
    } catch(e) {

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

    }
}

module.exports = {
    checkReferentCredentials,
    createReferent
};