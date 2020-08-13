const db = require("./config");

const createReport = async (email, description, placeUUID) => {
    try {
        let query = await db.pool.query("INSERT INTO report (email, description, place_uuid) VALUES ($1, $2, $3);", [email, description, placeUUID]);
        return query;
    } catch(e) {
        console.error(e.stack);
    }
}

module.exports = {
    createReport
};