const db = require("./config");
const { QueryError } = require("../routes/errors");

const getAdminByEmail = async (email) => {
    try {
        let query = await db.pool.query('SELECT * FROM admin WHERE email = $1', [email]);
        return query.rows[0];
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("QUERY_ADMININFO");
        throw qe;
    }
}

/**
 * 
 * @param {*} email ee
 * @param {*} password ee
 * @async
 * @throws {QueryError}
 */
const checkAdminCredentials = async (email, password) => {
    try {
        let query = await db.pool.query("SELECT (password = crypt($2, password)) AS valid FROM admin WHERE email = $1", [email, password]);
        
        if(query.rows[0] == undefined){
            // email is mistyped
            return false;
        }else{
            return query.rows[0].valid;
        }
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("QUERY_ADMINCREDCHECK");
        throw qe;
    }
}

module.exports = {
    getAdminByEmail,
    checkAdminCredentials
};