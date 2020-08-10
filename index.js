const express = require("express");
const bodyParser = require("body-parser");
const JWT = require('jsonwebtoken');
const cookieParser = require('cookie-parser')

const apiVersion = process.env.API_VERSION || 'v1';

const mountRoutes = require(`./routes/${apiVersion}/handler`);

const app = express();

mountRoutes(app);

// parse cookies into req.cookies.***
app.use(cookieParser())

// parse requests of content-type - application/json
app.use(express.json());

// parse requests of content-type - application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));

// simple route
/* app.get("/", (req, res) => {
  res.json({ message: "CIAOOO mammina" });
}); */

// set port, listen for requests
const PORT = process.env.NOBIS_APP_PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});