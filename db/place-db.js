const { v4: uuidv4 } = require('uuid');
const db = require("./config");

const listPlacesByReferentId = async (refId) => {

    try {
        // TODO: check INNER or LEFT
        let query = await db.pool.query("SELECT p.uuid, p.name AS place_name, p.capacity, p.visit_time, p.counter, p.enable, c.name AS category_name, b.name AS building_name FROM place AS p LEFT JOIN manage AS m ON m.place_uuid = p.uuid LEFT JOIN have AS h ON h.place_uuid = p.uuid LEFT JOIN building AS b ON b.id = p.building_id LEFT JOIN category AS c ON h.category_id = c.id WHERE m.referent_id = $1", [refId]);
        return query.rows;
    } catch(e) {

    }
}

const createPlace = async (name, lon, lat, capacity, visitTime, buildingId, categoryId, refId) => {
    let uuid = uuidv4();
    try {
        let queryPlace = await db.pool.query("INSERT INTO place (uuid, name, geometry, capacity, visit_time, building_id) VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5, $6, $7);", [uuid, name, lon, lat, capacity, visitTime, buildingId]);
        let queryCategory = await db.pool.query("INSERT INTO have (place_uuid, category_id) VALUES ($1, $2);", [uuid, categoryId]);
        let queryReferent = await db.pool.query("INSERT INTO manage (referent_id, place_uuid) VALUES ($1, $2);", [refId, uuid]);
        if(queryPlace && queryCategory && queryReferent)
            return ture;
    } catch(e) {

    }
}

const enablePlace = async (uuid) => {

    try {
        let query = await db.pool.query("UPDATE place SET enable = true WHERE uuid = $1;", [uuid]);
        return query;
    } catch(e) {

    }
}

// TODO: to put inside referent-db?
const disablePlace = async (uuid) => {

    try {
        let query = await db.pool.query("UPDATE place SET enable = false WHERE uuid = $1;", [uuid]);
        return query;
    } catch(e) {

    }
}

module.exports = {
    listPlacesByReferentId,
    createPlace,
    enablePlace,
    disablePlace
};