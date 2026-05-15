const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { connectDB, sql } = require('../config/database');

/**
 * @openapi
 * /filter:
 *   post:
 *     summary: Lọc báo cáo theo trạm, chỉ số, ngày, kiểu hiển thị
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     description: Chỉ cho phép user có role 'admin' hoặc 'manager'.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               stationId:
 *                 type: integer
 *               fromDate:
 *                 type: string
 *                 format: date
 *               toDate:
 *                 type: string
 *                 format: date
 *               dataType:
 *                 type: string
 *                 description: Tên chỉ số hoặc 'all'
 *               viewType:
 *                 type: string
 *                 enum: [monthly, daily]
 *     responses:
 *       200:
 *         description: Dữ liệu báo cáo
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
 *                       period:
 *                         type: string
 *                       indicator:
 *                         type: string
 *                       avgValue:
 *                         type: number
 *                       date:
 *                         type: string
 */
router.post('/filter', authenticateToken, authorizeRoles('admin', 'manager'), async (req, res) => {
    const { stationId, fromDate, toDate, dataType, viewType } = req.body;
    try {
        const pool = await connectDB();

        // Xử lý điều kiện lọc indicator
        let indicatorFilter = '';
        if (dataType && dataType !== 'all') {
            const indicators = Array.isArray(dataType) ? dataType : [dataType];
            const safeIndicators = indicators.map(name => `'${name.replace(/'/g, "''")}'`).join(',');
            indicatorFilter = `AND st.Name IN (${safeIndicators})`;
        }

        let query = '';
        if (viewType === 'monthly') {
            query = `
                SELECT
                    sr.StationId,
                    st.Name AS indicator,
                    YEAR(sr.RecordedAt) AS year,
                    MONTH(sr.RecordedAt) AS month,
                    CONCAT(YEAR(sr.RecordedAt), '-', RIGHT('0' + CAST(MONTH(sr.RecordedAt) AS VARCHAR(2)), 2)) AS period,
                    AVG(sr.Value) AS avgValue
                FROM SensorReadings sr
                JOIN SensorTypes st ON sr.SensorTypeId = st.Id
                JOIN StationSensors ss ON ss.StationId = sr.StationId AND ss.SensorTypeId = sr.SensorTypeId
                WHERE sr.StationId = @stationId
                  AND sr.RecordedAt >= @fromDate
                  AND sr.RecordedAt < DATEADD(day, 1, @toDate)
                  ${indicatorFilter}
                GROUP BY sr.StationId, st.Name, YEAR(sr.RecordedAt), MONTH(sr.RecordedAt)
                ORDER BY year, month, st.Name
            `;
        } else if (viewType === 'hourly') {
            // Lấy dữ liệu trung bình theo giờ từ SensorReadings
            query = `
                SELECT
                    sr.StationId,
                    st.Name AS indicator,
                    CAST(sr.RecordedAt AS DATE) AS date,
                    DATEPART(HOUR, sr.RecordedAt) AS hour,
                    AVG(sr.Value) AS avgValue
                FROM SensorReadings sr
                JOIN SensorTypes st ON sr.SensorTypeId = st.Id
                WHERE sr.StationId = @stationId
                  AND sr.RecordedAt BETWEEN @fromDate AND DATEADD(day, 1, @toDate)
                  ${indicatorFilter.replace(/ss\./g, 'st.').replace(/ss\./g, 'sr.')}
                GROUP BY sr.StationId, st.Name, CAST(sr.RecordedAt AS DATE), DATEPART(HOUR, sr.RecordedAt)
                ORDER BY date, hour, st.Name
            `;
        } else {
            query = `
                SELECT
                    ss.StationId,
                    st.Name AS indicator,
                    ss.StatDate as period,
                    ss.AvgValue as avgValue
                FROM StationStatistics ss
                JOIN SensorTypes st ON ss.SensorTypeId = st.Id
                WHERE ss.StationId = @stationId
                  AND ss.StatDate BETWEEN @fromDate AND @toDate
                  ${indicatorFilter}
                ORDER BY ss.StatDate ASC, st.Name ASC
            `;
        }
        const result = await pool.request()
            .input('stationId', sql.Int, stationId)
            .input('fromDate', sql.Date, fromDate)
            .input('toDate', sql.Date, toDate)
            .query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi truy vấn báo cáo', error: err.message });
    }
});

/**
 * @openapi
 * /indicators:
 *   get:
 *     summary: Lấy danh sách các chỉ số (SensorTypes) có trong hệ thống
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách chỉ số
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
 *                       Name:
 *                         type: string
 *                       Unit:
 *                         type: string
 */
// Lấy danh sách các chỉ số (SensorTypes)
router.get('/indicators', authenticateToken, async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT Id, Name, Unit FROM SensorTypes');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi truy vấn chỉ số', error: err.message });
    }
});

/**
 * @openapi
 * /sensor-types:
 *   get:
 *     summary: Lấy danh sách loại cảm biến
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách loại cảm biến
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
 *                       Name:
 *                         type: string
 *                       Unit:
 *                         type: string
 *                       Description:
 *                         type: string
 */
// Lấy danh sách loại cảm biến
router.get('/sensor-types', authenticateToken, async (req, res) => {
    try {
        const pool = await connectDB();
        const result = await pool.request().query('SELECT Id, Name, Unit, Description FROM SensorTypes');
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi truy vấn loại cảm biến', error: err.message });
    }
});

/**
 * @openapi
 * /api/report/station-sensors:
 *   get:
 *     summary: Lấy danh sách cảm biến của từng trạm hoặc một trạm theo stationId
 *     tags:
 *       - Report
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         schema:
 *           type: integer
 *         required: false
 *         description: ID của trạm cần lấy cảm biến
 *     responses:
 *       200:
 *         description: Danh sách cảm biến của từng trạm hoặc một trạm theo stationId
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
 *                       StationId:
 *                         type: integer
 *                       SensorTypeId:
 *                         type: integer
 *                       Name:
 *                         type: string
 *                       InstalledAt:
 *                         type: string
 */
// Lấy danh sách cảm biến của từng trạm hoặc một trạm theo stationId
router.get('/station-sensors', authenticateToken, async (req, res) => {
    try {
        const pool = await connectDB();
        const { stationId } = req.query;
        let query = `
            SELECT ss.StationId, ss.SensorTypeId, st.Name, ss.InstalledAt
            FROM StationSensors ss
            JOIN SensorTypes st ON ss.SensorTypeId = st.Id
        `;
        if (stationId) {
            query += ` WHERE ss.StationId = @stationId`;
        }
        const request = pool.request();
        if (stationId) {
            request.input('stationId', sql.Int, stationId);
        }
        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Lỗi truy vấn cảm biến trạm', error: err.message });
    }
});

module.exports = router; 