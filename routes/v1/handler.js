const admin = require('./admin');
const building = require('./building');
const feedback = require('./feedback');
const place = require('./place');
const referent = require('./referent');
const report = require('./report');

module.exports = app => {
  app.use('/admin', admin);
  app.use('/building', building);
  app.use('/feedback', feedback);
  app.use('/place', place);
  app.use('/referent', referent);
  app.use('/report', report);

  // forse bisogna utilizzare nuovamente router e in index usare app.use(/,./handler.js);

  // etc..
  app.get("/", (req, res) => {
    res.json({ message: "Test" });
  });
}
