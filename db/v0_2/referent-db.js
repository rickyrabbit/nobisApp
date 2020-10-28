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
const { QueryError, InsertError, DeleteError, UpdateError } = require("../../routes/errors");

/**
 * List referent attributes by email
 *
 * @param {*} email Referent Email
 * @return {*} Referent Firstname, Lastname etc
 */
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

/**
 * Check if email and password are correct
 *
 * @param {*} email Referent Email
 * @param {*} password Referent Password
 * @return {*} true if credentials are valid, false otherwise
 */
const checkReferentCredentials = async (email, password) => {
    try {
        let query = await db.pool.query(
            "SELECT id, enable, (password = crypt($2, password)) AS valid FROM referent WHERE email = $1",
            [email, password]
        );

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

/**
 * Check if a referent is altready registered with the provided email
 *
 * @param {*} email Referent Email
 * @return {*} true if email is present in the table, false otherwise
 */
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

/**
 * Change the referent password 
 *
 * @param {*} id Referent Id
 * @param {*} password Referent Password
 * @return {*} 
 */
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

/**
 * Create a new referent
 *
 * @param {*} firstname Referent Firstname
 * @param {*} lastname Referent Lastname
 * @param {*} email Referent Email
 * @param {*} password Referent Password
 * @return {*} 
 */
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

/**
 * List all the referents that are not been already enabled
 *
 * @return {*} list of referents
 */
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

/**
 * List all the referents that are been already enabled once
 *
 * @return {*} list of referents
 */
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

/**
 * Check wheather a provided referent is enabled
 *
 * @param {*} id Referent identifier 
 * @return {*} true if enabled, false otherwise
 */
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

/**
 * Enable a referent
 *
 * @param {*} id Referent identifier 
 * @return {*} 
 */
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

/**
 * Disable a referent
 *
 * @param {*} id Referent identifier 
 * @return {*} 
 */
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

/**
 * Get the email of the referent provided by identifier
 *
 * @param {*} id Referent identifier 
 * @return {*} Referent Email
 */
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