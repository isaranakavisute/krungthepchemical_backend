const express = require('express');
const dbPool = require('../db');
const router = express.Router();

// Middleware to log a page view
router.post('/logView', async (req, res) => {
    const { page_name } = req.body;
    if (!page_name) {
        return res.status(400).send('Page name is required');
    }

    const currentDate = new Date().toISOString().split('T')[0]; // Get the current date in YYYY-MM-DD format

    try {
        // First, check if there's already an entry for the current date and page_name
        const [rows] = await dbPool.promise().query('SELECT id FROM pageviews WHERE page_name = ? AND view_date = ?', [page_name, currentDate]);

        if (rows.length) {
            // If there's an entry, update the view_count
            await dbPool.promise().query('UPDATE pageviews SET view_count = view_count + 1 WHERE id = ?', [rows[0].id]);
        } else {
            // If no entry, insert a new one with view_count set to 1
            await dbPool.promise().query('INSERT INTO pageviews (page_name, view_date, view_count) VALUES (?, ?, 1)', [page_name, currentDate]);
        }

        res.send('View logged successfully');
    } catch (error) {
        res.status(500).send('Internal server error');
    }
});

module.exports = router;
