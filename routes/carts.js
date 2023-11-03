const express = require('express');
const dbPool = require('../db');
const router = express.Router();

router.get('/get-cart', (req, res) => {
    const { user_id } = req.query; // Retrieve user_id from query parameters

    // Check if user_id is provided
    if (!user_id) {
        return res.status(400).json({ error: 'user_id is required in the query parameters.' });
    }

    // Query the database to get cart items with detailed product information
    dbPool.query(`
        SELECT carts.add_id, products.product_id, products.product_name, products.price, products.description, products.stock, products.category, products.created_at, products.updated_at, products.product_img1, products.product_img2, products.product_img3, products.product_img4, products.product_img5, carts.add_on
        FROM carts
        INNER JOIN products ON carts.product_id = products.product_id
        WHERE carts.user_id = ?
    `, [user_id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Send the cart items with detailed product information in the response
        res.status(200).json(results);
    });
});


router.post('/add-to-cart', (req, res) => {
    const { user_id, product_id } = req.body;
    dbPool.query('INSERT INTO carts (user_id, product_id) VALUES (?, ?)', [user_id, product_id], (error) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        return res.status(200).json({ message: 'Product added to cart successfully.' });
    });
});

router.delete('/delete-from-cart', (req, res) => {
    const { add_id, user_id } = req.body;

    // Check if add_id and user_id are provided
    if (!add_id || !user_id) {
        return res.status(400).json({ error: 'add_id and user_id are required in the request body.' });
    }

    // Query the database to delete the item from the user's cart
    dbPool.query('DELETE FROM carts WHERE add_id = ? AND user_id = ?', [add_id, user_id], (error, results) => {
        if (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }

        // Check if the item was deleted successfully
        if (results.affectedRows > 0) {
            // Item deleted successfully
            return res.status(200).json({ message: 'Item deleted from the cart.' });
        } else {
            // Item not found in the cart
            return res.status(404).json({ error: 'Item not found in the cart.' });
        }
    });
});

// Handle the checkout process
router.post('/gotoCheckout', async (req, res) => {
    const { user_id, cartItems } = req.body;

    // 1. Calculate total price
    let totalPrice = cartItems.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

    try {
        // 2. Retrieve the shipping address for the user
        const [addressResults] = await dbPool.promise().query('SELECT address FROM users WHERE user_id = ?', [user_id]);
        if (addressResults.length === 0) {
            return res.status(404).send({ message: 'User not found.' });
        }
        const shippingAddress = addressResults[0].address;

        // 3. Insert entry into order_log with shipping_address
        const [orderResult] = await dbPool.promise().query(
            'INSERT INTO order_log(user_id, total_price, shipping_address) VALUES(?, ?, ?)',
            [user_id, totalPrice, shippingAddress]
        );

        // 4. Get the generated order_id
        const orderId = orderResult.insertId;

        // 5. For each cart item, insert into order_details
        for (const item of cartItems) {
            await dbPool.promise().query(
                'INSERT INTO order_details(order_id, product_id, quantity, unit_price) VALUES(?, ?, ?, ?)',
                [orderId, item.product_id, item.quantity || 1, item.price]
            );
        }

        // 6. Clear the cart for the user
        await dbPool.promise().query('DELETE FROM carts WHERE user_id = ?', [user_id]);

        res.status(200).send({ message: 'Checkout successful.', order_id: orderId });
    } catch (error) {
        res.status(500).send({ message: 'Error during checkout.', error });
    }
});



module.exports = router;

