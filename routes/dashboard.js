const express = require('express');
const dbPool = require('../db');

const router = express.Router();

router.get('/dashboard/recent-signups', async (req, res) => {
    try {
        // Execute the SQL query to retrieve the 5 most recent signups
        const result = await dbPool.promise().query(`
        SELECT
          user_id,
          email,
          created_at
        FROM
          users
        ORDER BY
        created_at DESC
        LIMIT 5;
      `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/dashboard/recent-sales', async (req, res) => {
    try {
        // Execute the SQL query to retrieve the 5 most recent orders with user details
        const result = await dbPool.promise().query(`
            SELECT 
                o.order_id,
                o.order_date,
                o.total_price,
                o.shipping_address,
                o.proof,
                o.order_status,
                u.email,
                u.full_name,
                u.phone
            FROM order_log AS o
            LEFT JOIN users AS u ON o.user_id = u.user_id
            ORDER BY o.order_date DESC
            LIMIT 5
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
// Users Endpoint
router.get('/dashboard/users', async (req, res) => {
    try {

        // Execute the SQL query to get user counts by permission and month
        const result = await dbPool.promise().query(`
            SELECT
                COUNT(user_id) as userCount
            FROM users
        `);

        // Extract the rows from the result
        const userCounts = result[0]; // Assuming the data is in the first element of the result array

        // Send the user counts in the response
        res.status(200).json(userCounts);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/dashboard/users2', async (req, res) => {
    try {
        // Execute the SQL query to get user counts by permission and month
        const result = await dbPool.promise().query(`
            SELECT
          user_id,
          email,
          permission,
          created_at
        FROM
          users
        `);

        // Extract the rows from the result
        // result.map(())
        let userCounts = 0; // Assuming the data is in the first element of the result array
        let premiumCounts = 0;
        let userAll = 0
        await result[0].map((_user) => {
            console.log(_user)
            userAll += 1
            if ("user" === _user.permission) {
                userCounts += 1
            }
            if ("premium" === _user.permission) {
                premiumCounts += 1
            }
        });
        console.log(userCounts,premiumCounts)
        // Send the user counts in the response
        res.status(200).json({
            "userCounts":userCounts,"premiumCounts":premiumCounts,"userAll":userAll
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});


// Endpoint to fetch data for a monthly sum of amounts
router.get('/dashboard/payment-lists', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of amounts
        const result = await dbPool.promise().query(`
        SELECT 
        MONTH(order_date) AS month,
        SUM(total_price) AS total_price_for_month
    FROM order_log
    GROUP BY MONTH(order_date)
    ORDER BY MONTH(order_date) DESC;
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/dashboard/payment-week', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of amounts
        const result = await dbPool.promise().query(`
        SELECT 
        DATE(order_date) AS date,
        SUM(total_price) AS total_price_daily
    FROM order_log
    GROUP BY DATE(order_date)
    ORDER BY DATE(order_date) DESC;
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
router.get('/dashboard/count-payment', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of amounts
        const result = await dbPool.promise().query(`
        SELECT
        COUNT(order_id) as 'COUNT'
        FROM
            order_log
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0][0]["COUNT"]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard/pageviews', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of view counts
        const result = await dbPool.promise().query(`
            SELECT
                DATE_FORMAT(view_date, '%Y-%m') AS month,
                SUM(view_count) AS total_view_count
            FROM
                pageviews
            GROUP BY
                month
            ORDER BY
                month;
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard/sales-count', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of view counts
        const result = await dbPool.promise().query(`
        SELECT
        COUNT(order_detail_id) AS sales_count
    FROM
        order_details
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/dashboard/income', async (req, res) => {
    try {
        // Execute the SQL query to get monthly sum of view counts
        const result = await dbPool.promise().query(`
        SELECT
        SUM(total_price) AS income
    FROM
        order_log
        `);

        // Extract and send the formatted data in the response
        res.status(200).json(result[0]);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
