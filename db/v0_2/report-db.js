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
 * List all unresolved reports
 *
 * @param {*} refID Referent identifier
 * @return {*} List of Reports
 */
const listReports = async (refID) => {
    try {
        let query = await db.pool.query("SELECT r.id, r.description, p.name AS place_name, b.name AS building_name FROM manage AS m LEFT JOIN place AS p ON p.uuid = m.place_uuid LEFT JOIN building AS b ON b.id = p.building_id RIGHT JOIN report AS r ON r.place_uuid = p.uuid WHERE m.referent_id = $1 AND r.resolve = false;", [refID]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

/**
 * Mark a report as resolved
 *
 * @param {*} reportId Report identifier
 * @return {*} 
 */
const resolveReport = async (reportId) => {
    try {
        let query = await db.pool.query("UPDATE report SET resolve = true WHERE id = $1;", [reportId]);
        return query;
    } catch(e) {
        
        console.error(e.stack);
        throw new UpdateError();
    }
}

/**
 * Create a Report related to a place
 *
 * @param {*} description Description of the problem
 * @param {*} placeUUID Place identifier
 * @return {*} 
 */
const createReport = async (description, placeUUID) => {
    try {
        let query = await db.pool.query("INSERT INTO report (description, place_uuid) VALUES ($1, $2, $3);", [description, placeUUID]);
        return query;
    } catch(e) {
        
        console.error(e.stack);
        throw new InsertError();
    }
}

module.exports = {
    listReports,
    resolveReport,
    createReport
};