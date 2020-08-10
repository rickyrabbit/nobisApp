const db = {
    name: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PSW,
    host: process.env.DB_HOST,
}

module.exports = db;