const API_VERSION = process.env.API_VERSION;

const user = require(`./${API_VERSION}/user`);
const admin = require(`./${API_VERSION}/admin`);
const building = require(`./${API_VERSION}/building`);
const feedback = require(`./${API_VERSION}/feedback`);
const place = require(`./${API_VERSION}/place`);
const referent = require(`./${API_VERSION}/referent`);
const report = require(`./${API_VERSION}/report`);


module.exports = app => {

  /*
  app.all('/auth', function (req, res, next) {
    //Controllare il JWT
    next(); // pass control to the next handler
  });
  */

  app.use('/', user);
  app.use('/admin', admin);
  app.use('/building', building);
  app.use('/feedback', feedback);
  app.use('/place', place);
  app.use('/referent', referent);
  app.use('/report', report);

  // forse bisogna utilizzare nuovamente router e in index usare app.use(/,./handler.js);

  /* app.get("/", (req, res) => {
    res.render('user-dashboard', {
      pageTitle: 'Dashboard Utente',
      loadMap: true,
      css: ['user-dashboard']
    });
  }); */
}
