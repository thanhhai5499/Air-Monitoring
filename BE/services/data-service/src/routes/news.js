const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Middleware kiểm tra quyền admin hoặc manager
function isAdminOrManager(req, res, next) {
    const role = req.user && req.user.role && req.user.role.toLowerCase();
    if (role === 'admin' || role === 'manager') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Chỉ admin hoặc manager mới được phép thực hiện thao tác này.' });
}

/**
 * @swagger
 * /news:
 *   get:
 *     summary: Lấy danh sách tin tức
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách tin tức thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       Id:
 *                         type: integer
 *                       Title:
 *                         type: string
 *                       Summary:
 *                         type: string
 *                       Content:
 *                         type: string
 *                       Image:
 *                         type: string
 *                       CreatedAt:
 *                         type: string
 *                         format: date-time
 *                       UpdatedAt:
 *                         type: string
 *                         format: date-time
 *                       CreatedByName:
 *                         type: string
 */
// Lấy danh sách tin tức (mọi role đều xem được)
router.get('/news', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query('SELECT N.Id, N.Title, N.Summary, N.Content, N.Image, N.CreatedAt, N.UpdatedAt, U.FullName as CreatedByName FROM News N LEFT JOIN Users U ON N.CreatedBy = U.Id ORDER BY N.CreatedAt DESC');
        res.json({ success: true, data: result.recordset });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

/**
 * @swagger
 * /news:
 *   post:
 *     summary: Thêm tin tức mới (chỉ admin/manager)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Thêm tin tức thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Không có token hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 */
// Thêm tin tức (chỉ admin/manager)
router.post('/news', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        const { title, summary, content, image } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title và Content là bắt buộc.' });
        }
        const pool = getPool();
        await pool.request()
            .input('Title', sql.NVarChar(255), title)
            .input('Summary', sql.NVarChar(500), summary || null)
            .input('Content', sql.NVarChar(sql.MAX), content)
            .input('Image', sql.NVarChar(255), image || null)
            .input('CreatedBy', sql.Int, req.user.id)
            .query('INSERT INTO News (Title, Summary, Content, Image, CreatedBy) VALUES (@Title, @Summary, @Content, @Image, @CreatedBy)');
        res.json({ success: true, message: 'Thêm tin tức thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

/**
 * @swagger
 * /news/{id}:
 *   put:
 *     summary: Sửa tin tức (chỉ admin/manager)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id của tin tức
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               summary:
 *                 type: string
 *               content:
 *                 type: string
 *               image:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật tin tức thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Không có token hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy tin tức
 */
// Sửa tin tức (chỉ admin/manager)
router.put('/news/:id', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        const { id } = req.params;
        const { title, summary, content, image } = req.body;
        if (!title || !content) {
            return res.status(400).json({ success: false, message: 'Title và Content là bắt buộc.' });
        }
        const pool = getPool();
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .input('Title', sql.NVarChar(255), title)
            .input('Summary', sql.NVarChar(500), summary || null)
            .input('Content', sql.NVarChar(sql.MAX), content)
            .input('Image', sql.NVarChar(255), image || null)
            .query('UPDATE News SET Title=@Title, Summary=@Summary, Content=@Content, Image=@Image WHERE Id=@Id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        }
        res.json({ success: true, message: 'Cập nhật tin tức thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

/**
 * @swagger
 * /news/{id}:
 *   delete:
 *     summary: Xóa tin tức (chỉ admin/manager)
 *     tags: [News]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: Id của tin tức
 *     responses:
 *       200:
 *         description: Xóa tin tức thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *       401:
 *         description: Không có token hoặc token hết hạn
 *       403:
 *         description: Không có quyền truy cập
 *       404:
 *         description: Không tìm thấy tin tức
 */
// Xóa tin tức (chỉ admin/manager)
router.delete('/news/:id', authenticateToken, isAdminOrManager, async (req, res) => {
    try {
        const { id } = req.params;
        const pool = getPool();
        const result = await pool.request()
            .input('Id', sql.Int, id)
            .query('DELETE FROM News WHERE Id=@Id');
        if (result.rowsAffected[0] === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tin tức.' });
        }
        res.json({ success: true, message: 'Xóa tin tức thành công.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router; 