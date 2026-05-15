const express = require('express');
const { getPool, sql } = require('../config/database');
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Sensor
 *     description: Quản lý sensor và ngưỡng sensor
 */

/**
 * @swagger
 * /sensor-thresholds:
 *   get:
 *     tags: [Sensor]
 *     summary: Lấy danh sách các chỉ số và các thông số SensorThresholds của nó
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách sensor và ngưỡng
 */
router.get('/sensor-thresholds', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const query = `
      SELECT 
        st.Id as SensorTypeId,
        st.Name,
        st.Description,
        st.Unit,
        th.Id as ThresholdId,
        th.Level,
        th.MinValue,
        th.MaxValue,
        th.Color,
        th.Description as ThresholdDescription
      FROM SensorTypes st
      LEFT JOIN SensorThresholds th ON st.Id = th.SensorTypeId
      WHERE LOWER(st.Name) <> 'battery'
      ORDER BY st.Id, th.Level
    `;
    const result = await pool.request().query(query);
    // Gom nhóm theo sensor type
    const sensorsMap = new Map();
    result.recordset.forEach(row => {
      if (!sensorsMap.has(row.SensorTypeId)) {
        sensorsMap.set(row.SensorTypeId, {
          id: row.SensorTypeId,
          name: row.Name,
          description: row.Description,
          unit: row.Unit,
          thresholds: []
        });
      }
      if (row.ThresholdId) {
        sensorsMap.get(row.SensorTypeId).thresholds.push({
          id: row.ThresholdId,
          level: row.Level,
          minValue: row.MinValue,
          maxValue: row.MaxValue,
          color: row.Color,
          description: row.ThresholdDescription
        });
      }
    });
    res.json({ success: true, data: Array.from(sensorsMap.values()) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /sensor:
 *   post:
 *     tags: [Sensor]
 *     summary: Thêm mới sensor (SensorType)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               unit: { type: string }
 *     responses:
 *       201:
 *         description: Thêm sensor thành công
 *       400:
 *         description: Thiếu trường bắt buộc
 *       500:
 *         description: Lỗi server
 */
router.post('/sensor', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { name, description, unit } = req.body;
    if (!name || !unit) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('Name', sql.NVarChar, name)
      .input('Description', sql.NVarChar, description || '')
      .input('Unit', sql.NVarChar, unit)
      .query('INSERT INTO SensorTypes (Name, Description, Unit) OUTPUT INSERTED.* VALUES (@Name, @Description, @Unit)');
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /sensor/{id}:
 *   put:
 *     tags: [Sensor]
 *     summary: Cập nhật sensor (SensorType)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               unit: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật sensor thành công
 *       500:
 *         description: Lỗi server
 */
router.put('/sensor/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, unit } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar, name)
      .input('Description', sql.NVarChar, description || '')
      .input('Unit', sql.NVarChar, unit)
      .query('UPDATE SensorTypes SET Name=@Name, Description=@Description, Unit=@Unit WHERE Id=@Id; SELECT * FROM SensorTypes WHERE Id=@Id');
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /sensor-threshold:
 *   post:
 *     tags: [Sensor]
 *     summary: Thêm mới sensor threshold
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sensorTypeId: { type: integer }
 *               level: { type: integer }
 *               minValue: { type: number }
 *               maxValue: { type: number }
 *               color: { type: string }
 *               description: { type: string }
 *     responses:
 *       201:
 *         description: Thêm sensor threshold thành công
 *       400:
 *         description: Thiếu trường bắt buộc
 *       500:
 *         description: Lỗi server
 */
router.post('/sensor-threshold', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { sensorTypeId, level, minValue, maxValue, color, description } = req.body;
    if (!sensorTypeId || !level || minValue === undefined || !color) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('SensorTypeId', sql.Int, sensorTypeId)
      .input('Level', sql.Int, level)
      .input('MinValue', sql.Float, minValue)
      .input('MaxValue', sql.Float, maxValue)
      .input('Color', sql.NVarChar, color)
      .input('Description', sql.NVarChar, description || '')
      .query('INSERT INTO SensorThresholds (SensorTypeId, Level, MinValue, MaxValue, Color, Description) OUTPUT INSERTED.* VALUES (@SensorTypeId, @Level, @MinValue, @MaxValue, @Color, @Description)');
    res.status(201).json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /sensor-threshold/{id}:
 *   put:
 *     tags: [Sensor]
 *     summary: Cập nhật sensor threshold
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sensorTypeId: { type: integer }
 *               level: { type: integer }
 *               minValue: { type: number }
 *               maxValue: { type: number }
 *               color: { type: string }
 *               description: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật sensor threshold thành công
 *       500:
 *         description: Lỗi server
 */
router.put('/sensor-threshold/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { sensorTypeId, level, minValue, maxValue, color, description } = req.body;
    const pool = await getPool();
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('SensorTypeId', sql.Int, sensorTypeId)
      .input('Level', sql.Int, level)
      .input('MinValue', sql.Float, minValue)
      .input('MaxValue', sql.Float, maxValue)
      .input('Color', sql.NVarChar, color)
      .input('Description', sql.NVarChar, description || '')
      .query('UPDATE SensorThresholds SET SensorTypeId=@SensorTypeId, Level=@Level, MinValue=@MinValue, MaxValue=@MaxValue, Color=@Color, Description=@Description WHERE Id=@Id; SELECT * FROM SensorThresholds WHERE Id=@Id');
    res.json({ success: true, data: result.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router; 