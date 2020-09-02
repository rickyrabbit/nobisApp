const db = require(`./config`);
const { QueryError } = require("../../routes/errors");

const listCategories = async () => {
    try {
        let query = await db.pool.query("SELECT * from category ORDER BY name;");
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        throw new QueryError();
    }
}

module.exports = {
    listCategories
};