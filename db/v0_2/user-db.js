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
const { v4: uuidv4 } = require('uuid');

// Errors Management
const { UpdateError, DeleteError, InsertError, QueryError } = require('../../routes/errors');

/**
 * Retrieve all places that are inside a specific Bounding Box (EPSG:4326)
 *
 * @param {*} xMin Minimum Latitude of the Boundig Box
 * @param {*} yMin Minimum Longitude of the Boundig Box
 * @param {*} xMax Maximum Latitude of the Boundig Box
 * @param {*} yMax Maximum Longitude of the Boundig Box
 * @return {*} List of places
 */
const getPlacesInMapBoundingBox = async (xMin,yMin,xMax,yMax) => {
    try {
        let query = await db.pool.query("SELECT * FROM findplacesinbox($1,$2,$3,$4);", [xMin,yMin,xMax,yMax]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACESINMAPBOUNDINGBOX");
        throw qe;
    }
}

/**
 * Retrieve all places which name contains a input string
 *
 * @param {*} inputPattern Search word
 * @return {*} List of places
 */
const getPlacesFromSearchPattern = async (inputPattern) => {
    try {
        let query = await db.pool.query("SELECT * FROM findplacesfrompattern($1);", [inputPattern]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACESFROMSEARCHPATTERN");
        throw qe;
    }
}

module.exports = {
    getPlacesInMapBoundingBox,
    getPlacesFromSearchPattern
}  
