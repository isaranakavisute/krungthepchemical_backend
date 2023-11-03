const express = require('express');
const dbPool = require('../db');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/proof'); // Specify the destination folder
    },
    filename: (req, file, cb) => {
        // Generate a unique filename for the uploaded file (e.g., timestamp + original name)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});
const storageQR = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/payment_acc'); // Specify the destination folder
    },
    filename: (req, file, cb) => {
        // Generate a unique filename for the uploaded file (e.g., timestamp + original name)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});

const upload = multer({ storage: storage });
const uploadQR = multer({ storage: storageQR });

router.get('/payment-acc', (req, res) => {
    const sql = 'SELECT *  FROM payment_acc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});
/*
router.get('/payment-list', async (req, res) => {
  try {
    const query = `
    SELECT 
        p.pay_id, 
        p.proof_img, 
        p.pay_at, 
        p.amount, 
        p.admin_id,
        p.position,
        a.email as admin_email,
        a.full_name as admin_name, 
        a.phone as admin_phone
    FROM payment_list AS p
    INNER JOIN admin AS a ON p.admin_id = a.admin_id ORDER BY pay_id DESC;
`;

    const [results] = await dbPool.promise().query(query);
    res.json(results);
} catch (error) {
    console.error("Error fetching joined data:", error);
    res.status(500).send("Internal Server Error");
}
});
*/
router.put('/payment-acc/:acc_id', uploadQR.single('qr_code'), async (req, res) => {
    try {
        const { acc_id } = req.params;
        const { acc_name, acc_no } = req.body;

        // Check if a new QR code image was uploaded
        if (req.file) {
            // Remove the old QR code image first (if it exists)
            const oldAccount = await dbPool.promise().query('SELECT qr_code FROM payment_acc WHERE acc_id = ?', [acc_id]);
            if (oldAccount[0] && oldAccount[0].qr_code) {
                await fs.unlink(`uploads/payment_acc/${oldAccount[0].qr_code}`);
            }

            // Update the record in the database with the new QR code image filename
            const qr_code = req.file.filename;
            await dbPool.promise().query(
                'UPDATE payment_acc SET acc_name = ?, acc_no = ?, qr_code = ? WHERE acc_id = ?',
                [acc_name, acc_no, qr_code, acc_id]
            );
        } else {
            // If no new image was uploaded, update the record without changing the QR code filename
            await dbPool.promise().query('UPDATE payment_acc SET acc_name = ?, acc_no = ? WHERE acc_id = ?', [acc_name, acc_no, acc_id]);
        }

        res.status(200).json({ message: 'Payment account updated successfully' });
    } catch (error) {
        console.error('Error updating payment account:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

router.put('/noti-payment', upload.single('paymentProof'), async (req, res) => {
    try {
        // Access form data from the request body
        const orderId = req.body.orderId; // Changed 'orderID' to 'orderId'
        const paymentProof = req.file;

        const updateStatus = 'รอการตรวจสอบ';

        // Ensure you have the correct SQL statement to update data in the order_log table
        const sql = "UPDATE order_log SET proof = ?, order_status = ? WHERE order_id = ?";

        // Update the order_log in the database
        const [results] = await dbPool.promise().query(sql, [paymentProof.filename, updateStatus, orderId]);

        if (results.affectedRows === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }

        console.log(orderId); // Changed 'orderID' to 'orderId' for consistency
        res.status(200).json({ message: 'แจ้งการชำระเงินสำเร็จ' });
    } catch (error) {
        console.error('Error handling form submission:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


/*
router.post('/add-sale-report', upload.single('paymentProof'), async (req, res) => {
  try {
    // Check if proof of payment file is present
    if (!req.file) {
      return res.status(422).json({ error: 'Proof of Payment is required' });
    }

    // Extract data from request body and file
    const { adminID, position, amount } = req.body;
    const paymentProof = req.file.filename; // Use the generated filename

    // SQL query to insert data into payment_list table
    const query = `
      INSERT INTO payment_list (admin_id, position, amount, proof_img)
      VALUES (?, ?, ?, ?)
    `;

    // Execute the query
    await dbPool.promise().query(query, [adminID, position, amount, paymentProof]);

    // Respond with success message
    return res.status(200).json({ message: 'Added sale report successfully' });
  } catch (error) {
    // Handle errors
    console.error("Error in /add-sale-report:", error);
    return res.status(500).json({ error: 'Server Error: ' + error.message });
  }
});
*/


module.exports = router