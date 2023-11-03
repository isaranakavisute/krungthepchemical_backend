const express = require('express');
const argon2 = require('argon2');
const { body, validationResult } = require('express-validator');
// const dbPool = require('../db');
const db = require("../mysqlService")
const dbPool = require('../db');
const router = express.Router();

// Define validation rules using Express-Validator
const signupValidationRules = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullname').notEmpty(),
    body('phone').isMobilePhone('any', { strictMode: false }),
    body('address').notEmpty(),
];

// Route for admin signup
router.post('/admin-signup', signupValidationRules, async (req, res) => {
    // Handle admin signup logic here
    const { email, password, fullname, phone, address } = req.body;
    console.log(email, password, fullname, phone, address)

    try {
        const checkEmailUser = await db.checkEmailUser(email)
        if (checkEmailUser === true){
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password
        const hash = await argon2.hash(password);

        // Insert the admin into the admin table
        const register_admin =await db.registerAdmin(email, hash, fullname, phone)
        if(register_admin === true){
            console.log('Admin registered successfully');
            // Send a success message in the response
            return res.status(200).json({ message: 'Admin account created successfully!' });
        }else{
            console.error('Error registering admin');
            // Send a custom error message in the response
            return res.status(500).json({ message: 'Something went wrong.' });
        }
        // Send a success message in the response
        return res.status(200).json({ message: 'Admin account created successfully!' });
    } catch (err) {
        console.error('Error registering admin:', err);
        // Send a custom error message in the response
        return res.status(500).json({ message: 'Something went wrong.' });
    }
});

router.post('/admin-signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log( email, password )
        // Search for admin data in the admin table using email
        const sql = 'SELECT admin_id, password, permission FROM admin WHERE email = ?';
        dbPool.query(sql, [email], async (err, result) => {
            console.log(result)
            if (err) {
                console.error('Error searching for admin:', err);
                return res.status(500).json({ message: 'Something went wrong' });
            } else if (result.length === 0) {
                return res.status(401).json({ message: 'Email is invalid' });
            } else {
                // Check the password
                const admin = result[0];
                const passwordMatch = await argon2.verify(admin.password, password);

                if (passwordMatch) {
                    // Send admin privileges data
                    return res.status(200).json({ admin_id: admin.admin_id, permission: admin.permission });
                } else {
                    return res.status(401).json({ message: 'Password is invalid' });
                }
            }
        });
    } catch (error) {
        console.log(error)
        return res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
