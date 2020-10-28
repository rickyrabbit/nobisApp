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
const { QueryError } = require("../../routes/errors");

/**
 * List all place categories available in the database
 *
 * @return {*} list of categories id and name
 */
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