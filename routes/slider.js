const express = require('express');
const dbPool = require('../db');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;

router.get('/slider', (req, res) => {
    const sql = 'SELECT *  FROM slider ORDER BY slide_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});

router.get('/logo', (req, res) => {
    const sql = 'SELECT *  FROM logo';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});

router.delete('/slider/:slide_id', async (req, res) => {
    const blog_id = req.params.blog_id;

    try {
        // Get the blog information from the database
        const selectQuery = 'SELECT slide_img FROM slider WHERE slide_id = ?';
        const [rows] = await dbPool.promise().query(selectQuery, [blog_id]);

        // Extract the blog_img URL from the result
        const blogImage = rows[0].slide_img;

        // Delete blog data from the database
        const deleteQuery = 'DELETE FROM slider WHERE slide_id = ?';
        const [result] = await dbPool.promise().query(deleteQuery, [blog_id]);

        // Delete blog image from the file system if it exists
        if (blogImage) {
            try {
                await fs.unlink(`uploads/slider/${blogImage}`);
            } catch (error) {
                // Handle the error if unable to delete the file
                console.error('Error deleting blog image:', error);
            }
        } else {
            // Handle the case where there is no image associated with the blog
            console.log('No image associated with the blog');
        }

        // Check the result of the database delete operation
        if (result.affectedRows > 0) {
            // Blog deleted successfully
            res.status(200).json({ message: 'Blog deleted successfully' });
        } else {
            // No blog found with the given ID
            res.status(404).json({ error: 'Blog not found' });
        }
    } catch (error) {
        console.error('Error deleting blog:', error);
        // Return an error response
        res.status(500).json({ error: 'Failed to delete blog' });
    }
});





const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the upload path. For example, 'uploads/' will store files in the 'uploads' directory.
        cb(null, 'uploads/slider');
    },
    filename: function (req, file, cb) {
        // Generate a unique filename for the uploaded file (you can customize this logic)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});
const logoStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Specify the upload path. For example, 'uploads/' will store files in the 'uploads' directory.
        cb(null, 'uploads/slider');
    },
    filename: function (req, file, cb) {
        // Generate a unique filename for the uploaded file (you can customize this logic)
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + '.' + file.originalname.split('.').pop());
    },
});

const upload = multer({
    storage: storage,
});
const logoupload = multer({
    storage: logoStorage,
});

router.post('/addSlider', upload.array('image'), async (req, res) => {
    const imageUrls = req.files.map((file) => file.filename);

    try {
        // Check if a blog with the same title already exists
        // Insert the new blog into the database
        const insertQuery = 'INSERT INTO slider (slide_img) VALUES (?)';
        await dbPool.promise().query(insertQuery, [imageUrls]);

        // Return a success response
        res.status(201).json({ message: 'Blog created successfully' });
    } catch (error) {
        console.error('Error creating blog:', error);
        // Return an error response for other types of errors
        res.status(500).json({ error: error.message });
    }
});


router.put('/logo/:logoId', logoupload.single('logo'), async (req, res) => {
    try {
        const { logoId } = req.params;

        let logo_img = null;

        if (req.file) {
            logo_img = req.file.filename;

            // Fetch the current image URL from the database
            const fetchImageQuery = 'SELECT logo_img FROM logo WHERE logo_id = ?';
            const [rows] = await dbPool.promise().query(fetchImageQuery, [logoId]);

            if (rows && rows.length > 0) {
                const currentImageURL = rows[0].logo_img;

                // Delete the old image file
                const oldImageFilePath = path.join(__dirname, 'uploads', 'logo', currentImageURL);
                await fs.unlink(oldImageFilePath);
            }
        }

        // Update the logo in the database
        const updateQuery = 'UPDATE logo SET logo_img = ? WHERE logo_id = ?';
        const values = [logo_img, logoId];

        await dbPool.promise().query(updateQuery, values);

        res.json({ message: 'Logo updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while updating the logo' });
    }
});


module.exports = router;
