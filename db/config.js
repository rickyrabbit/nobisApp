const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PSW,
  port: 5432
})

const getAdminByEmail = (request) => {

    const email = request.body.email;

    pool.connect((err, client, done) => {
        if (err) throw err
        client.query('SELECT * FROM admin WHERE email = $1', [email], (err, res) => {
            done()
            if (err) {
                console.log(err.stack)
            } else {
                return res.rows[0];
            }
        })
    })
/*
    pool.query('SELECT * FROM admin WHERE email = $1', [email], (error, results) => {
        if (error) {
            throw error
        }
        return results.rows[0];
  })
*/
}

module.exports = {
    getAdminByEmail
};