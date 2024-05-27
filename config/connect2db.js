const { Pool } = require('pg');

const DB_USER = process.env.DB_USER;
const DB_HOST = process.env.DB_HOST;
const DB_NAME = process.env.DB_NAME;
const DB_PASSWORD = process.env.DB_PASSWORD;
const DB_PORT = process.env.DB_PORT;

// singleton class
class Database {
  constructor() {
    this.pool = new Pool({
      user: DB_USER,
      host: DB_HOST,
      database: DB_NAME,
      password: DB_PASSWORD,
      port: DB_PORT,
    });
  }

  query(sql, params, callback) {
    return this.pool.query(sql, params, callback);
  }
}

module.exports = new Database();
