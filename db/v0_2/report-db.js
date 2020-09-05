const db = require(`./config`);
const { QueryError, InsertError, DeleteError, UpdateError } = require("../../routes/errors");

const listReports = async (refID) => {
    try {
        let query = await db.pool.query("SELECT r.id, r.description, p.name AS place_name, b.name AS building_name FROM manage AS m LEFT JOIN place AS p ON p.uuid = m.place_uuid LEFT JOIN building AS b ON b.id = p.building_id RIGHT JOIN report AS r ON r.place_uuid = p.uuid WHERE m.referent_id = $1 AND r.resolve = false;", [refID]);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

const resolveReport = async (reportId) => {
    try {
        let query = await db.pool.query("UPDATE report SET resolve = true WHERE id = $1;", [reportId]);
        return query;
    } catch(e) {
        
        console.error(e.stack);
        throw new UpdateError();
    }
}

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