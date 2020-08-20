const db = require("./config");

const listBuildings = async () => {
    try {
        let query = await db.pool.query("SELECT id, name, address, addr_num, city, ST_Y(geometry) AS lat, ST_X(geometry) AS lon FROM building ORDER BY name;");
        return query.rows;
    } catch(e) {

    }
}

const getBuildingNameByPlaceUUID = async (uuid) => {
    try {
        let query = await db.pool.query("SELECT b.name FROM place AS p LEFT JOIN building AS b ON b.id = p.building_id WHERE p.uuid = $1", [uuid]);
        return query.rows[0].name;
    } catch(e) {
        console.error(e.stack);
    }
}

const createBuilding = async (name, lon, lat, address, num, province) => {
    try {
        let query = await db.pool.query("INSERT INTO building (name, geometry, address, addr_num, city) VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, $5, $6);", [name, lon, lat, address, num, province]);
        if(query)
            return true;
    } catch(e) {
        console.error(e.stack);
    }
}

const deleteBuilding = async (id) => {
    try {
        // TODO: maybe a transaction?
        let queryPlace = await db.pool.query("DELETE FROM place WHERE building_id = $1;", [id]);
        let queryBuilding = await db.pool.query("DELETE FROM building WHERE id = $1;", [id]);
        if(queryPlace && queryBuilding)
            return true;
    } catch(e) {
        console.error(e.stack);
    }
}

module.exports = {
    listBuildings,
    getBuildingNameByPlaceUUID,
    createBuilding,
    deleteBuilding
};