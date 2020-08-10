const Pool = require('pg').Pool
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PSW,
  port: 5432,
})

const getAdminByEmail = (request) => {
  const email = parseInt(request.body.email)

  pool.query('SELECT * FROM admin WHERE email = $1', [id], (error, results) => {
    if (error) {
      throw error
    }
    console.log(results.rows);
    return results.rows[0];
  })
}

module.exports = {
    getAdminById
};