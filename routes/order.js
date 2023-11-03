const express = require('express');
const dbPool = require('../db');
const router = express.Router();


router.get('/orders', async (req, res) => {
    try {
        // Query to join order_log with users and fetch full_name
        const sql = `
            SELECT ol.*, u.full_name, u.phone
            FROM order_log ol 
            JOIN users u ON ol.user_id = u.user_id;
        `;

        const [results] = await dbPool.promise().query(sql);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/Approvedorders', async (req, res) => {
    try {
        // Query to join order_log with users and fetch full_name
        const sql = `
            SELECT ol.*, u.full_name, u.phone
            FROM order_log ol 
            JOIN users u ON ol.user_id = u.user_id WHERE ol.order_status = 'ตรวจสอบแล้ว';
        `;

        const [results] = await dbPool.promise().query(sql);

        res.status(200).json(results);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


router.put('/approve-order/:orderId', async (req, res) => {
    const { orderId } = req.params;

    // Start a transaction
    const connection = await dbPool.promise().getConnection();
    await connection.beginTransaction();

    try {
        // Update order status
        await connection.query("UPDATE order_log SET order_status = 'ตรวจสอบแล้ว' WHERE order_id = ?", [orderId]);

        // Fetch the order details
        const [orderDetails] = await connection.query("SELECT * FROM order_details WHERE order_id = ?", [orderId]);

        // Update stocks
        const stockUpdatePromises = orderDetails.map(async detail => {
            const [product] = await connection.query("SELECT stock FROM products WHERE product_id = ?", [detail.product_id]);
            const newStock = product[0].stock - 1; // Assuming orderDetails has a quantity field
            await connection.query("UPDATE products SET stock = ? WHERE product_id = ?", [newStock, detail.product_id]);
        });

        await Promise.all(stockUpdatePromises);

        // Commit the transaction
        await connection.commit();

        res.json({ message: 'Order approved and stock updated successfully' });

    } catch (error) {
        // Rollback the transaction in case of error
        await connection.rollback();
        console.error(error);
        res.status(500).send('Server error');
    } finally {
        connection.release();
    }
});

router.put('/UpdateOrder/:orderId', async (req, res) => {
    const { tracking } = req.body; // Extract tracking from the request body
    const { orderId } = req.params; // Extract order ID from the request parameters

    if (!tracking || !orderId) {
        return res.status(400).json({ error: "Order ID and tracking information are required." });
    }

    const sql = `UPDATE order_log SET tracking = ? WHERE order_id = ?`;

    try {
        const [results] = await dbPool.promise().query(sql, [tracking, orderId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: "No order found with the provided ID" });
        }
        res.json({ message: "Tracking updated successfully!" });

    } catch (error) {
        console.error('Error updating tracking:', error.message);
        res.status(500).json({ error: 'Error updating tracking' });
    }
});



module.exports = router;
