const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// Cấu hình multer lưu file vào thư mục uploads
const upload = multer({
    dest: path.join(__dirname, '../../uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

/**
 * @swagger
 * /upload/image:
 *   post:
 *     summary: Upload ảnh và trả về link ảnh
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Upload thành công, trả về link ảnh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   example: /uploads/abc123.jpg
 *       400:
 *         description: Không có file upload
 */
router.post('/image', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }
    // Trả về đường dẫn truy cập ảnh
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ url: imageUrl });
});

module.exports = router; 