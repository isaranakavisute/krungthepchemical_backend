const express = require('express');
const dbPool = require('../db');
const router = express.Router();
const multer = require('multer');
const fs = require('fs').promises;

router.get('/blogs', (req, res) => {
    const sql = 'SELECT *  FROM blogs ORDER BY blog_id desc';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results);
        }
    });
});

router.delete('/blogs/:blog_id', async (req, res) => {
    const blog_id = req.params.blog_id;

    try {
        // Get the blog information from the database
        const selectQuery = 'SELECT blog_img FROM blogs WHERE blog_id = ?';
        const [rows] = await dbPool.promise().query(selectQuery, [blog_id]);

        // Extract the blog_img URL from the result
        const blogImage = rows[0].blog_img;

        // Delete blog data from the database
        const deleteQuery = 'DELETE FROM blogs WHERE blog_id = ?';
        const [result] = await dbPool.promise().query(deleteQuery, [blog_id]);

        // Delete blog image from the file system if it exists
        if (blogImage) {
            try {
                await fs.unlink(`uploads/blogs/${blogImage}`);
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
        cb(null, 'uploads/blogs');
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

router.post('/createBlogs', upload.array('image'), async (req, res) => {
    const { title, content } = req.body;
    console.log(title, content)
    console.log(req.body)
    const imageUrls = req.files.map((file) => file.filename);

    try {
        // Check if a blog with the same title already exists
        const existingBlog = await dbPool.promise().query('SELECT blog_id FROM blogs WHERE title = ?', [title]);

        if (existingBlog[0].length > 0) {
            // Blog with the same title already exists, return an error response
            return res.status(400).json({ error: 'Blog with this title already exists' });
        }

        // Insert the new blog into the database
        const insertQuery = 'INSERT INTO blogs (title, content, blog_img) VALUES (?, ?, ?)';
        await dbPool.promise().query(insertQuery, [title, content, imageUrls]);

        // Return a success response
        res.status(201).json({ message: 'Blog created successfully' });
    } catch (error) {
        console.error('Error creating blog:', error);
        // Return an error response for other types of errors
        res.status(500).json({ error: error.message });
    }
});

router.put('/blogs/:blogId', (req, res) => {
    const blogId = req.params.blogId;
    const editedBlog = req.body;

    dbPool.query('UPDATE blogs SET ? WHERE blog_id = ?', [editedBlog, blogId], (error, results) => {
        if (error) {
            console.error('Error updating blog:', error);
            res.status(500).json({ message: 'Error updating blog' });
        } else if (results.affectedRows === 0) {
            res.status(404).json({ message: 'Blog not found' });
        } else {
            res.status(200).json({ message: 'Blog updated successfully', blog: editedBlog });
        }
    });
});

router.get('/latestBlogs', (req, res) => {
    // Select all columns from the 'blogs' table, order by 'blog_id' in descending order,
    // and then limit the result to the top 4 (latest) blogs.
    const sql = 'SELECT * FROM blogs ORDER BY blog_id DESC LIMIT 4';

    dbPool.query(sql, (err, results) => {
        if (err) {
            console.error('Error fetching data: ' + err.message);
            res.status(500).json({ error: 'Error fetching data' });
        } else {
            res.json(results); // Since results will be an array with up to 4 blogs, we return the whole results array.
        }
    });
});

module.exports = router;
