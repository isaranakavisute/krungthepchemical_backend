const express = require('express');
const dbPool = require('../db');
const router = express.Router();

router.post('/subscribes', (req, res) => {
    const { email } = req.body; // Extract the email from the request body

    if (email) {
        // Define the SQL query to check if the email exists
        const checkEmailQuery = 'SELECT email FROM subscribes WHERE email = ?';

        // Use the database connection pool to execute the query
        dbPool.getConnection((err, connection) => {
            if (err) {
                // Handle database connection error
                console.error('Database connection error:', err);
                res.status(500).json({ error: 'Database error' });
                return;
            }

            // Execute the SQL query to check if the email exists
            connection.query(checkEmailQuery, [email], (queryError, results) => {
                if (queryError) {
                    connection.release();
                    console.error('SQL query error:', queryError);
                    res.status(500).json({ error: 'Database error' });
                    return;
                }

                // Check if the email already exists
                if (results.length > 0) {
                    connection.release();
                    res.status(400).json({ error: 'Email already subscribed' });
                } else {
                    // If the email doesn't exist, proceed to insert it
                    const insertEmailQuery = 'INSERT INTO subscribes (email) VALUES (?)';

                    connection.query(insertEmailQuery, [email], (insertError) => {
                        connection.release(); // Release the connection

                        if (insertError) {
                            console.error('SQL query error:', insertError);
                            res.status(500).json({ error: 'Database error' });
                            return;
                        }

                        // Email successfully inserted
                        res.json({ message: 'Subscription successful' });
                    });
                }
            });
        });
    } else {
        res.status(400).json({ error: 'Invalid email' });
    }
});

router.post('/contact_us', (req, res) => {
    // Extract form data from the request body
    const { name, email, message } = req.body;

    // Validate and process the form data as needed
    // For example, you can save it to a database
    // Assuming you have a 'contacts' table in your database
    const sql = 'INSERT INTO contact_us (full_name, email, message) VALUES (?, ?, ?)';
    dbPool.query(sql, [name, email, message], (err, results) => {
        if (err) {
            console.error('Error inserting data: ' + err.message);
            res.status(500).json({ error: 'Error inserting data' });
        } else {
            res.status(200).json({ message: 'Form data submitted successfully' });
        }
    });
});

router.get('/contact_list', (req, res) => {
    const sql = 'SELECT *  FROM contact_us';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});
module.exports = router;
