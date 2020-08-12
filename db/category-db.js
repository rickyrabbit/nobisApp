const db = require("./config");

const listCategories = async () => {
    try {
        let query = await db.pool.query("SELECT * from category ORDER BY name;");
        return query.rows;
    } catch(e) {

    }
}

module.exports = {
    listCategories
};