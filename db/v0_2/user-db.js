const db = require(`./config`);
const { v4: uuidv4 } = require('uuid');
const { UpdateError, DeleteError, InsertError, QueryError } = require('../../routes/errors');

const getPlacesInMapBoundingBox = async (xMin,yMin,xMax,yMax) => {
    try {
        let query = await db.pool.query("SELECT * FROM findplacesinbox($1,$2,$3,$4);", [xMin,yMin,xMax,yMax]);
        //console.debug(`query rows returns:`);
        //console.debug(query.rows);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACESINMAPBOUNDINGBOX");
        throw qe;
    }
}


const getPlacesFromSearchPattern = async (inputPattern) => {
    try {
        let query = await db.pool.query("SELECT * FROM findplacesfrompattern($1);", [inputPattern]);
        //console.debug(`query rows returns:`);
        //console.debug(query.rows);
        return query.rows;
    } catch(e) {
        console.error(e.stack);
        let qe = new QueryError();
        qe.setReason("GETPLACESFROMSEARCHPATTERN");
        throw qe;
    }
}

module.exports = {
    getPlacesInMapBoundingBox,
    getPlacesFromSearchPattern
}  

/* 

11.785583
45.361795
12.001190
45.493834 
*/