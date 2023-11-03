const express = require('express');
const { body, validationResult } = require('express-validator');
const dbPool = require('../db');
const crypto = require('crypto');
const router = express.Router();
var nodemailer = require('nodemailer');

// Define validation rules using Express-Validator
const otpVerificationRules = [
    body('otp').notEmpty(),
    // Add more validation rules for 'otp' if needed.
];

// Route for verifying OTP
router.post('/verify-otp', otpVerificationRules, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Get the OTP and user ID from the request body
    const { otp, user_id } = req.body;

    try {
        // Check if the provided OTP matches the stored OTP for the user
        const otpCheckQuery = 'SELECT otp, user_id, permission FROM users WHERE user_id = ?';
        const [otpCheckResults] = await dbPool.promise().query(otpCheckQuery, [user_id]);

        if (otpCheckResults.length === 0) {
            return res.status(401).json({ message: 'User not found or OTP expired' });
        }

        const storedOTP = otpCheckResults[0].otp;
        const userID = otpCheckResults[0].user_id
        const permission = otpCheckResults[0].permission
        if (otp === storedOTP) {
            // Update the verification status in the database
            const verifyUpdateQuery = 'UPDATE users SET verify = ? WHERE user_id = ?';
            await dbPool.promise().query(verifyUpdateQuery, [true, user_id]); // Assuming 'true' means the user is verified

            return res.status(200).json({ user_id: userID, permission: permission });
        } else {
            return res.status(401).json({ message: 'Invalid OTP' });
        }
    } catch (error) {
        console.error('Error verifying OTP:', error);
        return res.status(500).json({ message: 'Something went wrong' });
    }
});


router.post('/otp-resend', otpVerificationRules, async (req, res) => {
    const { user_id } = req.body;

    try {
        // Generate a random OTP
        const randomOTP = crypto.randomBytes(4).toString('hex').toUpperCase();

        // Search for the user's email in the database
        const emailQuery = 'SELECT email FROM users WHERE user_id = ?';
        const [emailResults] = await dbPool.promise().query(emailQuery, [user_id]);

        if (emailResults.length === 0) {
            return res.status(401).json({ message: 'User not found' });
        }

        const email = emailResults[0].email; // Corrected here

        // Update the OTP in the user's record
        const otpSql = 'UPDATE users SET otp = ? WHERE user_id = ?';
        dbPool.query(otpSql, [randomOTP, user_id], (otpErr, otpResult) => {
            if (otpErr) {
                console.error('Error updating OTP:', otpErr);
                return res.status(500).json({ message: 'Error updating OTP' });
            }

            // Create a Nodemailer transporter for sending emails
            const transporter = nodemailer.createTransport({
                service: 'hotmail',
                auth: {
                    user: 'cromatic_1723@hotmail.com', // Your email address
                    pass: 'fiat5398', // Your email password
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
            transporter.sendMail(mailOptions, (emailErr, info) => {
                if (emailErr) {
                    console.error('Email could not be sent:', emailErr);
                    return res.status(500).json({ message: 'Error sending email' });
                } else {
                    console.log('Email sent:', info.response);
                    return res.status(200).json('OTP has been sent to your email.');
                }
            });
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});


module.exports = router;
