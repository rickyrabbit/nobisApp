const db = require("./config");
const { InsertError } = require("../routes/errors");

const createPerson = async (personUUID) => {
    try {
        let query = await db.pool.query("INSERT INTO person (uuid) VALUES ($1) ", [personUUID]);
        return query;
    } catch(e) {
        console.error(e.stack);
        throw new InsertError();
    }
}

module.exports = {
    createPerson
};