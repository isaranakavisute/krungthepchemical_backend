const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from a .env file

const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: "nakade_krungthepchemi",
  port:8889
});

module.exports = dbPool;
