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
