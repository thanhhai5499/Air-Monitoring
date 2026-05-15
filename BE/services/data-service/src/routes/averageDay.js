const express = require('express');
const { getPool, sql } = require('../config/database');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /average-day:
 *   get:
 *     summary: Lấy giá trị trung bình từng loại cảm biến từ tất cả các trạm trong vòng 1 tiếng mới nhất của ngày hiện tại
 *     tags: [Data]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy dữ liệu thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   sensor:
 *                     type: string
 *                   name:
 *                     type: string
 *                   avg:
 *                     type: number
 *                     nullable: true
 *                   unit:
 *                     type: string
 *                   level:
 *                     type: string
 *                     nullable: true
 *                   description:
 *                     type: string
 */
router.get('/average-day', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        
        // Lấy toàn bộ trạm
        const stations = await pool.request().query('SELECT Id FROM Stations');
        const stationIds = stations.recordset.map(row => row.Id);
        if (stationIds.length === 0) {
            return res.json([]);
        }
        
        // Lấy danh sách sensor types
        const sensorTypes = await pool.request().query('SELECT Id, Name, Description, Unit FROM SensorTypes');
        const sensorMap = {};
        sensorTypes.recordset.forEach(row => {
            sensorMap[row.Id] = row;
        });
        
        // Lấy ngày hiện tại theo múi giờ Asia/Ho_Chi_Minh (GMT+7)
        const now = new Date();
        const vietnamOffset = 7 * 60; // phút
        const localOffset = now.getTimezoneOffset(); // phút
        const diff = vietnamOffset + localOffset; // phút
        const vietnamTime = new Date(now.getTime() + diff * 60 * 1000);
        
        // Tạo thời gian bắt đầu và kết thúc của ngày hiện tại theo giờ Việt Nam
        const startOfDay = new Date(vietnamTime);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(vietnamTime);
        endOfDay.setHours(23, 59, 59, 999);
        
        // Tìm thời gian đo mới nhất trong ngày hiện tại
        const latestTimeQuery = await pool.request()
            .query(`
                SELECT MAX(RecordedAt) as LatestTime
                FROM SensorReadings
                WHERE StationId IN (${stationIds.join(',')})
                  AND RecordedAt >= '${startOfDay.toISOString()}'
                  AND RecordedAt <= '${endOfDay.toISOString()}'
            `);
        
        const latestTime = latestTimeQuery.recordset[0].LatestTime;
        if (!latestTime) {
            return res.json([]);
        }
        
        // Tính thời gian 1 tiếng trước thời điểm mới nhất
        const oneHourBefore = new Date(latestTime.getTime() - 60 * 60 * 1000);
        
        // Lấy dữ liệu trong vòng 1 tiếng mới nhất và tính trung bình theo SensorTypeId
        const stats = await pool.request()
            .query(`
                SELECT SensorTypeId, ROUND(AVG(Value), 0) as avgValue
                FROM SensorReadings
                WHERE StationId IN (${stationIds.join(',')})
                  AND RecordedAt >= '${oneHourBefore.toISOString()}'
                  AND RecordedAt <= '${latestTime.toISOString()}'
                  AND Value IS NOT NULL
                GROUP BY SensorTypeId
            `);
        
        // Lấy ngưỡng cảnh báo cho tất cả sensor
        const thresholds = await pool.request().query('SELECT SensorTypeId, Level, MinValue, MaxValue, Description FROM SensorThresholds');
        
        // Kết hợp kết quả
        const result = stats.recordset.map(r => {
            const sensor = sensorMap[r.SensorTypeId];
            let level = null;
            let description = '';
            
            // Tìm ngưỡng phù hợp với avgValue
            const tList = thresholds.recordset.filter(t => t.SensorTypeId === r.SensorTypeId);
            for (const t of tList) {
                if (
                    (t.MinValue === null || r.avgValue >= t.MinValue) &&
                    (t.MaxValue === null || r.avgValue <= t.MaxValue)
                ) {
                    level = t.Level;
                    description = t.Description || '';
                    break;
                }
            }
            
            return {
                sensor: sensor ? sensor.Name : r.SensorTypeId,
                name: sensor ? sensor.Description || sensor.Name : '',
                avg: r.avgValue !== null ? parseInt(r.avgValue) : null,
                unit: sensor ? sensor.Unit : '',
                level,
                description
            };
        });
        
        res.json(result);
    } catch (error) {
        console.error('Error in /data/average-day:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router; 