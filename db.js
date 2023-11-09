const mysql = require('mysql2');
const dotenv = require('dotenv');

dotenv.config(); // Load environment variables from a .env file

/*
const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: "nakade_krungthepchemi",
  port:8889
});
*/

const dbPool = mysql.createPool({
  host: 'localhost',
  user: 'isara',
  password: '1234',
  database: "mydb",
  port:3306
});

/*
{
  "DB_HOST": "localhost",
  "DB_USER": "root",
  "DB_PASSWORD": "1234",
  "DB_DATABASE": "mydb"
}
*/

module.exports = dbPool;
