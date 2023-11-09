//auth.js

const express = require('express');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const dbPool = require('../db');

const jwtGenerate = (user) => {
    const accessToken = jwt.sign(
        { name: user.email, id: user.id },
        "token",
        { expiresIn: "3m", algorithm: "HS256" }
    )

    return accessToken
}

const jwtRefreshTokenGenerate = (user) => {
    const refreshToken = jwt.sign(
        { name: user.email, id: user.id },
       "token",
        { expiresIn: "1d", algorithm: "HS256" }
    )

    return refreshToken
}

const router = express.Router();
var nodemailer = require('nodemailer');
const crypto = require('crypto');

// Generate a random OTP
// Function to generate a random OTP
const generateOTP = () => {
    const otp = crypto.randomBytes(4).toString('hex').toUpperCase();
    return otp;
};



// Define validation rules using Express-Validator
const signupValidationRules = [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }),
    body('fullname').notEmpty(),
    body('phone').isMobilePhone('any', { strictMode: false }),
];

// Route for signup
router.post('/signup', signupValidationRules, async (req, res) => {
    // Handle signup logic here
    const { email, password, fullname, phone } = req.body;
    console.log(email, password, fullname, phone)

    /*
    try {
        // Check if the email already exists
        const emailCheckQuery = 'SELECT user_id FROM users WHERE email = ?';
        const [emailCheckResults] = await dbPool.promise().query(emailCheckQuery, [email]);

        if (emailCheckResults.length > 0) {
            console.error('Error: Email already exists.');
            // Send a custom error message in the response
            return res.status(400).json({ message: 'Email already exists.' });
        }

        // Hash the password
        const hash = await argon2.hash(password);

        // Insert the user into the database
        const insertUserQuery =
            'INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)';
        await dbPool.promise().query(insertUserQuery, [email, hash, fullname, phone]);

        console.log('User registered successfully');
        // Send a success message in the response
        return res.status(200).json({ message: 'Create account successful !' });
    } catch (err) {
        console.error('Error registering user:', err);
        // Send a custom error message in the response
        return res.status(500).json({ message: 'Something went wrong.' });
    }
    */

    try {
            // Check if the email already exists
            const emailCheckQuery = 'SELECT user_id FROM users WHERE email = ?';
            const [emailCheckResults] = await dbPool.promise().query(emailCheckQuery, [email]);

            if (!emailCheckResults.length) {
                //console.error('Error: Email already exists.');
                // Send a custom error message in the response
                //return res.status(400).json({ message: 'Email already exists.' });
                console.error('Email has already been created. Pleases create a new account');
            }

            // Hash the password
            const hash = await argon2.hash(password);

            // Insert the user into the database
            const insertUserQuery =
                'INSERT INTO users (email, password, full_name, phone) VALUES (?, ?, ?, ?)';
            await dbPool.promise().query(insertUserQuery, [email, hash, fullname, phone]);

            console.log('User registered successfully');
            // Send a success message in the response
            return res.status(200).json({ message: 'Create account successful !' });
        } catch (err) {
            console.error('Error registering user:', err);
            // Send a custom error message in the response
            return res.status(500).json({ message: 'There is error in processing' });
        }


});

router.post('/signin', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(email, password)

        // Generate OTP
        const randomOTP = generateOTP();

        // Search for the user in the database
        const sql = 'SELECT user_id, password, permission FROM users WHERE email = ?';

        /*
        dbPool.query(sql, [email], async (err, result) => {
            if (err) {
                console.error('Error searching for the user:', err);
                return res.status(500).json({ message: 'Something went wrong' });
            } else if (result.length === 0) {
                return res.status(401).json({ message: 'Email is invalid' });
            } else {
                // Verify the password
                const user = result[0];
                const passwordMatch = await argon2.verify(user.password, password);


                if (passwordMatch) {
                    // Update the OTP in the user's record
                    const userId = user.user_id;
                    const permission = user.permission
                    const access_token = jwtGenerate(user)
                    const refresh_token = jwtRefreshTokenGenerate(user)
                    const otpSql = 'UPDATE users SET otp = ? WHERE user_id = ?';
                    dbPool.query(otpSql, [randomOTP, userId], (otpErr, otpResult) => {
                        if (otpErr) {
                            console.error('Error updating OTP:', otpErr);
                            return res.status(500).json({ message: 'Error updating OTP' });
                        } else {
                            // Create a Nodemailer transporter for sending emails
                            const transporter = nodemailer.createTransport({
                                service: 'hotmail',
                                auth: {
                                    user: 'cromatic_1723@hotmail.com', // Your Gmail address
                                    pass: 'fiat5398',         // Your App Password or Gmail password
                                },
                            });

                            // Define the email content
                            const mailOptions = {
                                from: 'cromatic_1723@hotmail.com',
                                to: email, // Recipient's email address
                                subject: 'Your OTP Code',
                                text: `Your OTP is: ${randomOTP}`,
                            };

                            // Send the email
                            // transporter.sendMail(mailOptions, (emailErr, info) => {
                            //     if (emailErr) {
                            //         console.error('Email could not be sent:', emailErr);
                            //         return res.status(500).json({ message: 'Error sending email' });
                            //     } else {
                            //         console.log('Email sent:', info.response);
                            //         return res.status(200).json({ user_id: userId });
                            //     }
                            // });
                            return res.status(200).json({
                                user_id: userId ,
                                access_token:access_token,
                                refresh_token:refresh_token
                            });
                        }
                    });
                } else {
                    return res.status(401).json({ message: 'Password is invalid' });
                }
            }
        });
        */

         dbPool.query(sql, [email], async (err, result) => {
                    if (err) {
                        //console.error('Error searching for the user:', err);
                        return res.status(500).json({ message: 'There is a problem with sql query' });
                    } else if (result.length === 0) {
                        //return res.status(401).json({ message: 'Email is invalid' });
                        return res.status(401).json({ message: 'There is not a user by that name' });
                    } else {
                        // Verify the password
                        const user = result[0];
                        const passwordMatch = await argon2.verify(user.password, password);


                        if (passwordMatch) {
                            // Update the OTP in the user's record
                            const userId = user.user_id;
                            const permission = user.permission
                            const access_token = jwtGenerate(user)
                            const refresh_token = jwtRefreshTokenGenerate(user)
                            const otpSql = 'UPDATE users SET otp = ? WHERE user_id = ?';
                            dbPool.query(otpSql, [randomOTP, userId], (otpErr, otpResult) => {
                                if (otpErr) {
                                    console.error('Error updating OTP:', otpErr);
                                    return res.status(500).json({ message: 'Error updating OTP' });
                                } else {
                                    // Create a Nodemailer transporter for sending emails
                                    const transporter = nodemailer.createTransport({
                                        service: 'hotmail',
                                        auth: {
                                            user: 'cromatic_1723@hotmail.com', // Your Gmail address
                                            pass: 'fiat5398',         // Your App Password or Gmail password
                                        },
                                    });

                                    // Define the email content
                                    const mailOptions = {
                                        from: 'cromatic_1723@hotmail.com',
                                        to: email, // Recipient's email address
                                        subject: 'Your OTP Code',
                                        text: `Your OTP is: ${randomOTP}`,
                                    };

                                    // Send the email
                                    // transporter.sendMail(mailOptions, (emailErr, info) => {
                                    //     if (emailErr) {
                                    //         console.error('Email could not be sent:', emailErr);
                                    //         return res.status(500).json({ message: 'Error sending email' });
                                    //     } else {
                                    //         console.log('Email sent:', info.response);
                                    //         return res.status(200).json({ user_id: userId });
                                    //     }
                                    // });
                                    return res.status(200).json({
                                        user_id: userId ,
                                        access_token:access_token,
                                        refresh_token:refresh_token
                                    });
                                }
                            });
                        } else {
                            return res.status(401).json({ message: 'Password is invalid' });
                        }
                    }
                });



    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});

router.put('/signout', signupValidationRules, async (req, res) => {
    // Handle signup logic here
    const { user_id } = req.body;
    try {
        const signout =
            'UPDATE users SET verify = ? WHERE user_id = ?';
        await dbPool.promise().query(signout, [ false, user_id ]);

        console.log('User registered successfully');
        // Send a success message in the response
        return res.status(200).json({ message: 'Signed out' });
    } catch (err) {
        console.error('Error registering user:', err);
        // Send a custom error message in the response
        return res.status(500).json({ message: 'Something went wrong.' });
    }
});
router.put('/forgot', async (req, res) => {
    try {
        const { user_email } = req.body;
        console.log(user_email)

        // Check if the email exists in your 'users' table
        const userExistsQuery = 'SELECT user_id FROM users WHERE email = ?';
        const [userRows] = await dbPool.promise().query(userExistsQuery, [user_email]);

        // If the user with the provided email doesn't exist, return an error
        if (!userRows.length) {
            console.log('Received email:', user_email);
            return res.status(404).json({ error: 'User not found' });
        }

        // Generate a random password
        const generatePassword = () => {
            const newPass = crypto.randomBytes(4).toString('hex').toUpperCase();
            return newPass;
        };
        const randomPassword = generatePassword();
        const hash = await argon2.hash(randomPassword);
        // Create a transporter for sending emails
        const transporter = nodemailer.createTransport({
            service: 'hotmail', // Change to the email service you want to use
            auth: {
                user: 'cromatic_1723@hotmail.com', // Your email address
                pass: 'fiat5398', // Your App Password or email password
            },
        });

        // Define the email content
        const mailOptions = {
            from: 'cromatic_1723@hotmail.com',
            to: user_email, // Recipient's email address
            subject: 'Resetting Password',
            text: `Your new password is: ${randomPassword}`,
        };

        // Send the email
        transporter.sendMail(mailOptions, async (emailErr, info) => {
            if (emailErr) {
                console.error('Email could not be sent:', emailErr);
                return res.status(500).json({ error: 'Error sending email' });
            } else {
                // Update the user's password in the 'users' table
                const updatePasswordQuery = 'UPDATE users SET password = ? WHERE email = ?';
                await dbPool.promise().query(updatePasswordQuery, [hash, user_email]);

                // Respond with a success message
                return res.status(200).json({ message: 'Password reset successful' });
            }
        });
    } catch (err) {
        console.error('Error handling forgot password request:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});


module.exports = router;