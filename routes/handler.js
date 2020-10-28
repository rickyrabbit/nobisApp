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

const API_VERSION = process.env.API_VERSION;

const user = require(`./${API_VERSION}/user`);
const admin = require(`./${API_VERSION}/admin`);
const building = require(`./${API_VERSION}/building`);
const place = require(`./${API_VERSION}/place`);
const referent = require(`./${API_VERSION}/referent`);
const report = require(`./${API_VERSION}/report`);


module.exports = app => {

  app.use('/', user);
  app.use('/admin', admin);
  app.use('/building', building);
  app.use('/place', place);
  app.use('/referent', referent);
  app.use('/report', report);
}
