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
 * Get place name given its UUID
 *
 * @param {*} uuid Place identifier
 * @return {*} Place Name
 */
const getPlaceNameByUUID = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT name FROM place WHERE uuid = $1", [uuid]);
        return query.rows[0].name;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACENAMEBYUUID");
        throw qe;
    }
}

/**
 * Get all place attributes given its UUID
 *
 * @param {*} uuid place identifier
 * @return {*} place uuid, name, longitude, latitude, capacity, visit time, building id and category id
 */
const getPlaceByUUID = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT p.uuid, p.name, ST_Y(p.geometry) AS latitude, ST_X(p.geometry) AS longitude, p.capacity, p.visit_time, p.building_id, h.category_id FROM place AS p LEFT JOIN have AS h ON h.place_uuid = p.uuid WHERE uuid = $1", [uuid]);
        return query.rows[0];
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACEBYUUID");
        throw qe;
    }
}


/**
 * Get all places linked to a specific referent
 *
 * @param {*} refId Referent Identifier
 * @return {*} place uuid, name, longitude, latitude, capacity, visit time, building id and category id
 */
const listPlacesByReferentId = async (refId) => {
    try {
        // TODO: check INNER or LEFT
        let query = await db.pool.query("SELECT p.uuid, p.name AS place_name, p.capacity, p.visit_time, p.counter, p.enable, c.name AS category_name, b.name AS building_name FROM place AS p LEFT JOIN manage AS m ON m.place_uuid = p.uuid LEFT JOIN have AS h ON h.place_uuid = p.uuid LEFT JOIN building AS b ON b.id = p.building_id LEFT JOIN category AS c ON h.category_id = c.id WHERE m.referent_id = $1 ORDER BY p.name", [refId]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("LISTPLACESBYREFID");
        throw qe;
    }
}

/**
 * Create a new Place
 *
 * @param {*} name Place Name
 * @param {*} lon Place Longitude
 * @param {*} lat Place Latitude 
 * @param {*} capacity Capacity Name
 * @param {*} visitTime Place Visit Time
 * @param {*} buildingId Buildind id related to the place
 * @param {*} categoryId Category id related to the place
 * @param {*} refId Referent id related to the place
 * @return {*} 
 */
const createPlace = async (name, lon, lat, capacity, visitTime, buildingId, categoryId, refId) => {
    let uuid = uuidv4();
    try {
        let queryPlace = await db.pool.query("INSERT INTO place (uuid, name, geometry, capacity, visit_time, building_id) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7);", [uuid, name, lon, lat, capacity, visitTime, buildingId]);
        let queryCategory = await db.pool.query("INSERT INTO have (place_uuid, category_id) VALUES ($1, $2);", [uuid, categoryId]);
        let queryReferent = await db.pool.query("INSERT INTO manage (referent_id, place_uuid) VALUES ($1, $2);", [refId, uuid]);
        if(queryPlace && queryCategory && queryReferent)
            return true;
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("CREATEPLACE");
        throw ie;
    }
}

/**
 * Update a new Place
 *
 * @param {*} name Place Name
 * @param {*} lon Place Longitude
 * @param {*} lat Place Latitude 
 * @param {*} capacity Capacity Name
 * @param {*} visitTime Place Visit Time
 * @param {*} buildingId Buildind id related to the place
 * @param {*} categoryId Category id related to the place
 * @param {*} uuid Place uuid
 * @return {*} 
 */
const updatePlace = async (name, lon, lat, capacity, visitTime, buildingId, categoryId, uuid) => {
    try {
        let queryPlace = await db.pool.query("UPDATE place SET name = $1, geometry = ST_SetSRID(ST_MakePoint($2, $3), 4326), capacity = $4, visit_time = $5, building_id = $6 WHERE uuid = $7;", [name, lon, lat, capacity, visitTime, buildingId, uuid]);
        let queryCategory = await db.pool.query("UPDATE have SET category_id = $1 WHERE place_uuid = $2;", [categoryId, uuid]);
        if(queryPlace && queryCategory)
            return true;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason("UPDATEPLACE");
        throw ue;
    }
}

/**
 * Delete a place
 *
 * @param {*} uuid Place uuid
 * @return {*} 
 */
const deletePlace = async (uuid) => {
    try {
        // TODO: maybe a transaction?
        // TODO: remove also in visit relation? maybe a place should not be deleted..
        let queryCategory = await db.pool.query("DELETE FROM have WHERE place_uuid = $1;", [uuid]);
        let queryReferent = await db.pool.query("DELETE FROM manage WHERE place_uuid = $1;", [uuid]);
        let queryReport = await db.pool.query("DELETE FROM report WHERE place_uuid = $1;", [uuid]);
        let queryOpening = await db.pool.query("DELETE FROM opening WHERE place_uuid = $1;", [uuid]);
        let queryPlace = await db.pool.query("DELETE FROM place WHERE uuid = $1;", [uuid]);
        if(queryPlace && queryOpening && queryCategory && queryReferent && queryReport)
            return true;
    } catch(e) {
        console.error(e.stack);
        let de = new DeleteError();
        de.setReason("DELETEPLACE");
        throw de;
    }
}

/**
 * Enable a place
 *
 * @param {*} uuid Place uuid
 * @return {*} 
 */
const enablePlace = async (uuid) => {
    try {
        let query = await db.pool.query("UPDATE place SET enable = true WHERE uuid = $1;", [uuid]);
        return query;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason("ENABLEPLACE");
        throw ue;
    }
}

/**
 * Check if a place is enabled
 *
 * @param {*} uuid Place uuid
 * @return {*} True if enabled, false otherwise
 */
const isEnabled = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT enable FROM place WHERE uuid = $1;", [uuid]);
        return query.rows[0].enable;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("CHECKIFPLACEISENABLED");
        throw qe;
    }
}

/**
 * Disable a place
 *
 * @param {*} uuid Place uuid
 * @return {*} 
 */
const disablePlace = async (uuid) => {
    try {
        let query = await db.pool.query("UPDATE place SET enable = false WHERE uuid = $1;", [uuid]);
        return query;
    } catch(e) {
        console.error(e.stack);
        let ue = new UpdateError();
        ue.setReason("DISABLEPLACE");
        throw ue;
    }
}

/**
 * Check-in operation in a place
 *
 * @param {*} personUUID Person Identifier
 * @param {*} placeUUID Place Identifier
 * @return {*} True if successful, false otherwise
 */
const checkIn = async (personUUID, placeUUID) => {
    try{
        let handlecheckIn = await db.pool.query("CALL handlecheckin($1,$2);",[personUUID,placeUUID]);
        if(handlecheckIn.rows.length==0){
            return true;
        }else{
            return false;
        }
    }catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("PERSONCHECKINPLACE");
        throw ie;
    }
}

/**
 * Check-out operation from a place
 *
 * @param {*} personUUID Person Identifier
 * @param {*} placeUUID Place Identifier
 * @return {*} True if successful, false otherwise
 */
const checkOut = async (personUUID, placeUUID) => {
    try {
        //let now = Date.now()/1000.0;
        let handlecheckOut = await db.pool.query("CALL handlecheckout($1,$2);",[personUUID,placeUUID]);
        /* let queryPlace = await db.pool.query("UPDATE place SET counter = counter + 1 WHERE uuid = $1;", [placeUUID]);
        let queryLog = await db.pool.query("INSERT INTO log (is_in, timestamp, assumption) VALUES (true, to_timestamp($1),$2) RETURNING id;", [now,assumption]);
        let queryVisit = await db.pool.query("INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES ($1, $2, $3);", [placeUUID, queryLog.rows[0].id, personUUID]); */
        if(handlecheckOut.rows.length==0){
            return true;
        }else{
            return false;
        }
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("PERSONCHECKOUTPLACE");
        throw ie;
    }
}

/**
 * Create a new feedback related to a place (1 = low crowding, 2 = medium crowding and 3 = high crowding)
 *
 * @param {*} personUUID Person indentifier
 * @param {*} placeUUID Place indentifier
 * @param {*} feedback Feedback value (1, 2 or 3)
 * @return {*} True if successful, false otherwise
 */
const createFeedback = async (personUUID, placeUUID, feedback) => {
    try {
        let queryLog = await db.pool.query("SELECT MAX(log_id) FROM visit WHERE place_uuid = $1 AND person_uuid = $2;", [placeUUID, personUUID]);
        let queryFeedback = await db.pool.query("INSERT INTO feedback (id, rating, log_id) VALUES (nextval('feedback_id_seq'), $1, $2);", [feedback, queryLog.rows[0].max]);

        if(queryLog && queryFeedback)
            return true;
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("CREATEFEEDBACK");
        throw ie;
    }
}

/**
 * Create or replace opening hours for a place
 *
 * @param {*} placeUUID Place Identifier
 * @param {*} intervals Array of weekday, start_hour and end_hour
 * @return {*} 
 */
const replaceIntervals = async (placeUUID, intervals) => {
    try {
        let queryDelete = await db.pool.query("DELETE FROM opening WHERE place_uuid = $1;", [placeUUID]);
        intervals.forEach(async interval => {
            let queryInsert = await db.pool.query("INSERT INTO opening (place_uuid, weekday, start_hour, end_hour) VALUES ($1, $2, $3, $4)", [placeUUID, interval.weekday, interval.starthour, interval.endhour]);
        });

        if(queryDelete)
            return true;
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("REPLACEINTERVALS");
        throw ie;
    }
}

/**
 * Retrieve opening hours about a place
 *
 * @param {*} placeUUID Place Identifier
 * @return {*} Array of weekday, start_hour and end_hour
 */
const getOpeningTimeByUUID = async (placeUUID) => {
    try {
        let query = await db.pool.query("SELECT * FROM opening WHERE place_uuid = $1 ORDER BY weekday;", [placeUUID]);

        if(query)
            return query.rows;
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("GETOPENINGS");
        throw ie;
    }
}

module.exports = {
    getPlaceNameByUUID,
    getPlaceByUUID,
    listPlacesByReferentId,
    createPlace,
    updatePlace,
    deletePlace,
    enablePlace,
    isEnabled,
    disablePlace,
    checkIn,
    checkOut,
    createFeedback,
    replaceIntervals,
    getOpeningTimeByUUID
};