const db = require("./config");

const createPerson = async (personUUID) => {
    try {
        let query = await db.pool.query("INSERT INTO person (uuid) VALUES ($1) ", [personUUID]);
        return query;
    } catch(e) {
        console.error(e.stack);
    }
}

module.exports = {
    createPerson
};