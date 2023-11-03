const express = require('express');
const dbPool = require('../db');
const router = express.Router();


router.get('/users', (req, res) => {
  const sql = 'SELECT user_id, full_name, email, phone, address FROM users ORDER BY user_id desc';

  dbPool.query(sql, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    } else {
      res.json(results);
    }
  });
});

router.delete('/users/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    // Implement the logic to delete the user from your database
    const deleteQuery = 'DELETE FROM users WHERE user_id = ?';
    await dbPool.promise().query(deleteQuery, [userId]);

    // Return a success response
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    // Return an error response
    res.status(500).json({ error: 'Failed to delete user' });
  }
});
router.get('/admin', (req, res) => {
  const sql = 'SELECT admin_id, full_name, email, phone FROM admin ORDER BY admin_id desc';

  dbPool.query(sql, (err, results) => {
    if (err) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
      res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
    } else {
      res.json(results);
    }
  });
});

router.delete('/admin/:adminId', async (req, res) => {
  const adminId = req.params.adminId;

  try {
    // Implement the logic to delete the user from your database
    const deleteQuery = 'DELETE FROM admin WHERE admin_id = ?';
    await dbPool.promise().query(deleteQuery, [adminId]);

    // Return a success response
    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    // Return an error response
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

router.get('/user-profile/:user_id', (req, res) => {
  const user_id = req.params.user_id;

  dbPool.query(
      'SELECT user_id, email, full_name, phone, address FROM users WHERE user_id = ?',
      [user_id],
      (error, results) => {
        if (error) {
          console.error('Error fetching user data:', error);
          return res.status(500).json({ error: 'Error fetching user data. Please try again later.' });
        }

        if (results.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }

        const userData = results[0]; // Assuming user_id is unique, so we take the first result

        return res.status(200).json(userData);
      }
  );
});

router.get('/user-orders/:userId', async (req, res) => {
  const userId = req.params.userId;

  // Check if user ID is provided
  if (!userId) {
    return res.status(400).json({ error: 'User ID is required.' });
  }

  try {
    // Fetch orders based on user ID
    const query = `
            SELECT * FROM order_log 
            WHERE user_id = ?
            ORDER BY order_date DESC;
        `;

    const [rows] = await dbPool.promise().execute(query, [userId]);

    // Send fetched orders to the client
    res.json(rows);

  } catch (error) {
    console.error('Error fetching user orders:', error);
    res.status(500).json({ error: 'Internal Server Error.' });
  }
});
router.get('/order-details/:order_id', async (req, res) => {
  try {
    const { order_id } = req.params; // extract order_id from request parameters

    // Query the database for order details corresponding to the provided order_id
    const [results] = await dbPool.promise().query(
        `
          SELECT 
              o.order_detail_id, 
              o.order_id, 
              o.product_id, 
              o.quantity, 
              o.unit_price, 
              p.product_name, 
              p.product_img1 
          FROM order_details o
          JOIN products p ON o.product_id = p.product_id
          WHERE o.order_id = ?;
          `,
        [order_id]
    );

    // Send the fetched data back as a response
    res.status(200).json(results);
  } catch (error) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ message: 'Error fetching order details.' });
  }
});




module.exports = router