const db = require("./config");

const listBuildings = async () => {
    try {
        let query = await db.pool.query("SELECT * FROM building ORDER BY name;");
        return query.rows;
    } catch(e) {

    }
}

module.exports = {
    listBuildings
};