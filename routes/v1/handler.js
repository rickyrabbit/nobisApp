const admin = require('./admin');
const building = require('./building');
const feedback = require('./feedback');
const place = require('./place');
const referent = require('./referent');
const report = require('./report');

module.exports = app => {

  /*
  app.all('/auth', function (req, res, next) {
    //Controllare il JWT
    next(); // pass control to the next handler
  });
  */

  app.use('/admin', admin);
  app.use('/building', building);
  app.use('/feedback', feedback);
  app.use('/place', place);
  app.use('/referent', referent);
  app.use('/report', report);

  // forse bisogna utilizzare nuovamente router e in index usare app.use(/,./handler.js);

  app.get("/", (req, res) => {
    res.render('user-dashboard', {
      pageTitle: 'Dashboard Utente',
      loadMap: true,
      css: ['user-dashboard']
    });
  });
}
