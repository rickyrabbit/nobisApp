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
const { QueryError, InsertError, DeleteError } = require("../../routes/errors");

/**
 * List all buildings and their attributes
 *
 * @return {*} list of buildings and related id, name, address, address number, city, latitude and longitude
 */
const listBuildings = async () => {
    try {
        let query = await db.pool.query("SELECT id, name, address, addr_num, city, ST_Y(geometry) AS lat, ST_X(geometry) AS lon, brand FROM building ORDER BY name;");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

/**
 * Return the associated building name given a place uuid
 *
 * @param {*} uuid place identifier
 * @return {*} Building name
 */
const getBuildingNameByPlaceUUID = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT b.name FROM place AS p LEFT JOIN building AS b ON b.id = p.building_id WHERE p.uuid = $1", [uuid]);
        return query.rows[0].name;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

/**
 * Return the associated building name given a place uuid
 *
 * @param {*} uuid place identifier
 * @return {*} Building name
 */
const getBrandByPlaceUUID = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT b.brand FROM place AS p LEFT JOIN building AS b ON b.id = p.building_id WHERE p.uuid = $1", [uuid]);
        return query.rows[0].brand;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

/**
 * Create a new building
 *
 * @param {*} name name of the building
 * @param {*} lon brand of the building (University, Municipality)
 * @param {*} lon longitude of the building
 * @param {*} lat latitude of the building
 * @param {*} address address of the building
 * @param {*} num address number of the building
 * @param {*} province province of the building
 * @return {*} true if success
 */
const createBuilding = async (name, lon, lat, address, num, province, brand) => {
    try {
        let query = await db.pool.query("INSERT INTO building (name, geometry, address, addr_num, city, brand) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6, $7);", [name, lon, lat, address, num, province, brand]);
        if(query)
            return true;
    } catch(e) {
        console.error(e.stack);
        throw new InsertError();
    }
}

/**
 * Delete a building
 *
 * @param {*} id building id 
 * @return {*} true if success
 */
const deleteBuilding = async (id) => {
    try {
        // TODO: maybe a transaction?
        let queryPlace = await db.pool.query("DELETE FROM place WHERE building_id = $1;", [id]);
        let queryBuilding = await db.pool.query("DELETE FROM building WHERE id = $1;", [id]);
        if(queryPlace && queryBuilding)
            return true;
    } catch(e) {
        console.error(e.stack);
        throw new DeleteError();
    }
}

module.exports = {
    listBuildings,
    getBuildingNameByPlaceUUID,
    getBrandByPlaceUUID,
    createBuilding,
    deleteBuilding
};