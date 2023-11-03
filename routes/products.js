const express = require('express');
const dbPool = require('../db');
const router = express.Router();
const multer = require('multer')
const fs = require('fs');

router.get('/products', (req, res) => {
    const sql = 'SELECT *  FROM products ORDER BY product_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        } else {
            res.json(results);
        }
    });
});
router.get('/new-products', (req, res) => {
    const sql = 'SELECT *  FROM products WHERE new_status = 1 ORDER BY product_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        } else {
            res.json(results);
        }
    });
});
router.get('/pop-products', (req, res) => {
    const sql = 'SELECT *  FROM products WHERE pop_status = 1 ORDER BY product_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        } else {
            res.json(results);
        }
    });
});
router.get('/best-products', (req, res) => {
    const sql = 'SELECT *  FROM products WHERE best_status = 1 ORDER BY product_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        } else {
            res.json(results);
        }
    });
});

router.delete('/products/:product_id', async (req, res) => {
    const product_id = req.params.product_id;

    try {
        // Get the product information from the database
        const selectQuery = 'SELECT product_img1, product_img2, product_img3, product_img4, product_img5 FROM products WHERE product_id = ?';
        const [rows] = await dbPool.promise().query(selectQuery, [product_id]);

        // Extract the product_img URLs from the result
        const productImages = [
            rows[0].product_img1,
            rows[0].product_img2,
            rows[0].product_img3,
            rows[0].product_img4,
            rows[0].product_img5
        ];

        // Delete product data from the database
        const deleteQuery = 'DELETE FROM products WHERE product_id = ?';
        await dbPool.promise().query(deleteQuery, [product_id]);

        // Delete product images from the file system
        productImages.forEach(async (imageUrl) => {
            if (imageUrl) {
                try {
                    await fs.promises.unlink(`uploads/products/${imageUrl}`);
                } catch (error) {
                    console.error('Error deleting product image:', error);
                }
            }
        });

        // Return a success response
        res.status(200).json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        // Return an error response
        res.status(500).json({ error: 'Failed to delete product' });
    }
});


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the upload path. For example, 'uploads/' will store files in the 'uploads' directory.
        cb(null, 'uploads/products');
    },
    filename: function (req, file, cb) {
        // Generate a unique filename for the uploaded file (you can customize this logic)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 2, // Limit file size to 2 MB
    },
});

router.post('/createProducts', upload.array('image', 5), async (req, res) => {
    const { product_name, category, description, price, stock } = req.body;
    const imageUrls = req.files.map((file) => {
        const imageUrl = `${file.filename}`;
        return imageUrl;
    });

    try {
        // Check if a product with the same name already exists
        const existingProduct = await dbPool
            .promise()
            .query('SELECT product_id FROM products WHERE product_name = ?', [product_name]);

        if (existingProduct[0].length > 0) {
            // Product with the same name already exists, return an error response
            return res.status(400).json({ error: 'Product with this name already exists' });
        }

        // Implement the logic to insert the new product into your database
        const insertQuery = `INSERT INTO products (product_img1, product_img2, product_img3, product_img4, product_img5, product_name, category, description, price, stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        // Dynamically create the values array based on the number of images uploaded
        const values = [];
        for (let i = 0; i < 5; i++) {
            values.push(i < imageUrls.length ? imageUrls[i] : null);
        }
        values.push(product_name, category, description, price, stock);

        await dbPool.promise().query(insertQuery, values);

        // Return a success response
        res.status(201).json({ message: 'Product created successfully' });
    } catch (error) {
        console.error('Error creating product:', error);
        // Return an error response for other types of errors
        res.status(500).json({ 'error': error.message });
    }
});

router.put('/products/:productId', (req, res) => {
    const productId = req.params.productId;
    const editedProduct = req.body;

    dbPool.query('UPDATE products SET ? WHERE product_id = ?', [editedProduct, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            res.status(500).json({ message: 'Error updating product' });
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Product not found' });
        } else {
            res.status(200).json({ message: 'Product updated successfully', product: editedProduct });
        }
    });
});

router.put('/new-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const newStatus = req.body.new_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET new_status = ? WHERE product_id = ?', [newStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});
router.put('/del-new-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const newStatus = req.body.new_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET new_status = ? WHERE product_id = ?', [newStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});
router.put('/pop-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const popStatus = req.body.pop_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET pop_status = ? WHERE product_id = ?', [popStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});
router.put('/del-pop-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const popStatus = req.body.pop_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET pop_status = ? WHERE product_id = ?', [popStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});
router.put('/best-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const bestStatus = req.body.best_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET best_status = ? WHERE product_id = ?', [bestStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});
router.put('/del-best-products/:productId', (req, res) => {
    const productId = req.params.productId;
    const bestStatus = req.body.best_status;
    // Update product status in the database
    dbPool.query('UPDATE products SET best_status = ? WHERE product_id = ?', [bestStatus, productId], (error, results) => {
        if (error) {
            console.error('Error updating product:', error);
            return res.status(500).json({ message: 'Error updating product' });
        }

        if (results.affectedRows === 0) {
            // No product found with the given product_id
            return res.status(404).json({ message: 'Product not found' });
        }

        // Product updated successfully
        res.status(200).json({ message: 'Product updated successfully'});
    });
});

router.get('/categories', (req, res) => {
    const sql = 'SELECT category FROM products GROUP BY category';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล: ' + err.message);
            res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
        } else {
            res.json(results);
        }
    });
});

module.exports = router