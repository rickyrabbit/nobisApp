const { v4: uuidv4 } = require('uuid');
const db = require(`./config`);
const { UpdateError, DeleteError, InsertError, QueryError } = require('../../routes/errors');

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

const deletePlace = async (uuid) => {
    try {
        // TODO: maybe a transaction?
        // TODO: remove also in visit relation? maybe a place should not be deleted..
        let queryCategory = await db.pool.query("DELETE FROM have WHERE place_uuid = $1;", [uuid]);
        let queryReferent = await db.pool.query("DELETE FROM manage WHERE place_uuid = $1;", [uuid]);
        let queryReport = await db.pool.query("DELETE FROM report WHERE place_uuid = $1;", [uuid]);
        let queryPlace = await db.pool.query("DELETE FROM place WHERE uuid = $1;", [uuid]);
        if(queryPlace && queryCategory && queryReferent && queryReport)
            return true;
    } catch(e) {
        console.error(e.stack);
        let de = new DeleteError();
        de.setReason("DELETEPLACE");
        throw de;
    }
}

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

const checkIn = async (personUUID, placeUUID, assumption) => {
    try {
        let now = Date.now()/1000.0;
        let queryPlace = await db.pool.query("UPDATE place SET counter = counter + 1 WHERE uuid = $1;", [placeUUID]);
        let queryLog = await db.pool.query("INSERT INTO log (is_in, timestamp, assumption) VALUES (true, to_timestamp($1),$2) RETURNING id;", [now,assumption]);
        let queryVisit = await db.pool.query("INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES ($1, $2, $3);", [placeUUID, queryLog.rows[0].id, personUUID]);

        if(queryPlace && queryLog && queryVisit)
            return true;
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("PERSONCHECKINPLACE");
        throw ie;
    }
}

const checkOut = async (personUUID, placeUUID, assumption) => {
    try {
        let now = Date.now()/1000.0;
        let queryPlace = await db.pool.query("UPDATE place SET counter = counter - 1 WHERE uuid = $1;", [placeUUID]);
        let queryLog = await db.pool.query("INSERT INTO log (is_in, timestamp, assumption) VALUES (false, to_timestamp($1)) RETURNING id;", [now, assumption]);
        let queryVisit = await db.pool.query("INSERT INTO visit (place_uuid, log_id, person_uuid) VALUES ($1, $2, $3);", [placeUUID, queryLog.rows[0].id, personUUID]);

        if(queryPlace && queryLog && queryVisit)
            return true;
            
    } catch(e) {
        console.error(e.stack);
        let ie = new InsertError();
        ie.setReason("PERSONCHECKOUTPLACE");
        throw ie;
    }
}

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
    createFeedback
};