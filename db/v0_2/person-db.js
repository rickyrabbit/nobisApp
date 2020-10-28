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
const { InsertError } = require("../../routes/errors");

/**
 * Create a new person
 *
 * @param {*} personUUID person identifier
 * @return {*} 
 */
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