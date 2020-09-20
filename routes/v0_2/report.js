/*
 * Copyright 2020 Mattia Avanzi, Riccardo Coniglio
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

// TODO: Add Error Management

const router = require("express").Router();

// Current API version used
const API_VERSION = process.env.API_VERSION;

// Database
const db = require(`../../db/${API_VERSION}/report-db`);

/**
 * Route that allows to create reports.
 * @name post/create
 * @function
 * @memberof module:routers/report
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/create', async (req, res) => {
    try {
        let query = db.createReport(req.body.problem, req.body.placeUUID);
        if (query)
            res.sendStatus(200);
    } catch (error) {
        console.debug(err);
        res.sendStatus(500);
    }
});

/**
 * Route that allows to resolve a report.
 * @name post/id/resolve
 * @function
 * @memberof module:routers/report
 * @inner
 * @param {string} path - Express path
 * @param {callback} middleware - Express middleware.
 */
router.post('/:id/resolve', async (req, res) => {
    try {
        let result = await db.resolveReport(req.params.id);
        if (result)
            res.sendStatus(200);
    } catch (error) {
        console.debug(err);
        res.sendStatus(500);
    }
});

module.exports = router;