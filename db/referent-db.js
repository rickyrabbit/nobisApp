const db = require("./config");
const { QueryError, InsertError, DeleteError, UpdateError } = require("../routes/errors");

const checkReferentCredentials = async (email, password) => {
    try {
        let query = await db.pool.query(
            "SELECT id, enable, (password = crypt($2, password)) AS valid FROM referent WHERE email = $1",
            [email, password]
        );
        ///console.log(`vediamo cos'è => checkReferentCredentials: ${JSON.stringify(query.rows[0])}`);
        if(query.rows[0] !== undefined){
            return query.rows[0];
        }else{
            return {"id":undefined,"enable":false,"valid":false};
        }
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
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
        throw new InsertError();
    }
}

const listNewReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = true ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

const listOldReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = false ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

const isReferentEnabled = async (id) => {

    try {
        let query = await db.pool.query("SELECT enable FROM referent WHERE id = $1", [id]);
        return query.rows[0].enable;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('REFNOTENABLED'); 
        throw qe;
    }
}

const enableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = true, new = false WHERE id = $1;", [id]);
        return query;
    } catch(e) {
        console.error(e.stack);
        throw new UpdateError();
    }
}

const disableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = false WHERE id = $1;", [id]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new UpdateError();
    }
}

const getEmailByReferentId = async (id) => {
    try {
        let query = await db.pool.query("SELECT email FROM referent WHERE id = $1;", [id]);
        return query.rows[0].email;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

module.exports = {
    checkReferentCredentials,
    createReferent,
    listNewReferents,
    listOldReferents,
    isReferentEnabled,
    enableReferent,
    disableReferent,
    getEmailByReferentId
};