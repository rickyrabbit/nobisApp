/*
 * Copyright 2020 Mattia Avanzi, Riccardo Coniglio, Università degli Studi di Padova
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const db = require(`./config`);

// Errors Management
const { QueryError } = require("../../routes/errors");

/**
 * Get admin details by email
 *
 * @param {*} email admin email
 * @return {*} firstname, lastname etc about admin
 */
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
 * Select all emails in admin table
 *
 * @return {*} admins mails
 */
const getAdminsEmails = async () => {
    try {
        let query = await db.pool.query('SELECT email FROM admin');
        let emails = [];
        for (let i = 0; i < query.rows.length; i++) {
            emails.push(query.rows[i].email);
        }
        return emails;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("QUERY_ADMINSEMAILS");
        throw qe;
    }
}


/**
 * Check if email and password are correct
 *
 * @param {*} email Admin email
 * @param {*} password Admin password
 * @return {*} true if credentials are valid, false otherwise
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
    getAdminsEmails,
    checkAdminCredentials
};