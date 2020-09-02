const db = require(`./config`);
const { QueryError, InsertError, DeleteError, UpdateError } = require("../../routes/errors");


const getReferentByEmail = async (email) => {
    try {
        let query = await db.pool.query(
            "SELECT * FROM referent WHERE email = $1",
            [email]
        );
        if(query.rows[0] !== undefined){
            return query.rows[0];
        }
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('GETREFBYEMAIL'); 
        throw qe;
    }
}

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
        let qe = new QueryError();
        qe.setReason('CHECKREFCREDENTIALS'); 
        throw qe;
    }
}

const checkEmailPresence = async (email) => {
    try {
        let query = await db.pool.query(
            "SELECT EXISTS (SELECT FROM referent WHERE email = $1)",
            [email]
        );
        return query.rows[0].exists;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('CHECKEMAILPRESENCE'); 
        throw qe;
    }
}


const updatePassword = async (id, password) => {

    try {
        let query = await db.pool.query("UPDATE referent SET password = crypt($1, gen_salt('bf')) WHERE id = $2;", [password, id]);
        return query;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason('UPDATEPSW'); 
        throw ue;
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
        let ie = new InsertError();
        ie.setReason('CREATEREF'); 
        throw ie;
    }
}


const listNewReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = true ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('LISTNEWREFS'); 
        throw qe;
    }
}


const listOldReferents = async () => {

    try {
        let query = await db.pool.query("SELECT * FROM referent WHERE new = false ORDER BY id ASC");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('LISTOLDREFS'); 
        throw qe;
    }
}


const isReferentEnabled = async (id) => {

    try {
        let query = await db.pool.query("SELECT enable FROM referent WHERE id = $1", [id]);
        return query.rows[0].enable;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('ISREFENABLED'); 
        throw qe;
    }
}


const enableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = true, new = false WHERE id = $1;", [id]);
        return query;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason('ENABLEREF'); 
        throw ue;
    }
}


const disableReferent = async (id) => {

    try {
        let query = await db.pool.query("UPDATE referent SET enable = false WHERE id = $1;", [id]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason('DISABLEREF'); 
        throw ue;
    }
}


const getEmailByReferentId = async (id) => {
    try {
        let query = await db.pool.query("SELECT email FROM referent WHERE id = $1;", [id]);
        return query.rows[0].email;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason('GETEMAILFROMREFID'); 
        throw qe;
    }
}

module.exports = {
    getReferentByEmail,
    checkReferentCredentials,
    checkEmailPresence,
    updatePassword,
    createReferent,
    listNewReferents,
    listOldReferents,
    isReferentEnabled,
    enableReferent,
    disableReferent,
    getEmailByReferentId
};