const mysql = require('mysql2');
const dotenv = require('dotenv');
const config = require('config')
dotenv.config(); // Load environment variables from a .env file
const emailCheckQuery = 'SELECT admin_id FROM admin WHERE email = ?';
// const insertAdminQuery =
//     'INSERT INTO admin (email, password, full_name, phone) VALUES (?, ?, ?, ?)';
// const sql = 'SELECT admin_id, password, permission FROM admin WHERE email = ?';
// const emailCheckQuery = 'SELECT user_id FROM users WHERE email = ?';
// const insertUserQuery =
//     'INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)';
// const sql = 'SELECT user_id, password, permission FROM users WHERE email = ?';
// const otpSql = 'UPDATE users SET otp = ? WHERE user_id = ?';
// const signout =
//     'UPDATE users SET verify = ? WHERE user_id = ?';
// const userExistsQuery = 'SELECT user_id FROM users WHERE email = ?';

let dbPool;
class mysqlService {
    async init(success) {
        dbPool = mysql.createPool({
            host: "localhost",
            user: "root",
            port: 8889,
            password: "root",
            database: "nakade_krungthepchemi",
        });
        let email = "pnyfiat@gmail.com"
        const emailCheckQuery = 'SELECT user_id FROM users WHERE email = ?';
        const [emailCheckResults] = await dbPool.promise().query(emailCheckQuery, [email]);
        success(true);
    }
    getDB() {
        return dbPool
    }
    async email(email, password, fullname, phone, address) {
        const emailCheckQuery = 'SELECT admin_id FROM admin WHERE email = ?';
        await dbPool.promise().query(emailCheckQuery, [email]);
        if (emailCheckResults.length > 0) {

        }
    }
    async checkEmailUser(email) {
        const emailCheckQuery = 'SELECT admin_id FROM admin WHERE email = ?';
        const [emailCheckResults] = await dbPool.promise().query(emailCheckQuery, [email]);
        return emailCheckResults.length > 0;
    }
    async registerAdmin(email, password, full_name, phone) {
        try{
            const insertAdminQuery =
                'INSERT INTO admin (email, password, full_name, phone) VALUES (?, ?, ?, ?)';
            await dbPool.promise().query(insertAdminQuery, [email, password, full_name, phone]);
            return true
        }catch(err) {
            console.log(err)
            return false
        }
    }



}

const instance = new mysqlService();
module.exports = instance;