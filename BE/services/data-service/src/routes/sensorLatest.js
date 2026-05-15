const express = require('express');
const { getPool, sql } = require('../config/database');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /sensor-latest:
 *   get:
 *     summary: Lấy danh sách trạm và các sensor của trạm với giá trị đo mới nhất
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: Danh sách trạm và sensor
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
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       status:
 *                         type: string
 *                       statusText:
 *                         type: string
 *                       location:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       sensors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                             name:
 *                               type: string
 *                             value:
 *                               type: number
 *                               nullable: true
 *                             unit:
 *                               type: string
 *                             recordedAt:
 *                               type: string
 *                               format: date-time
 *                             level:
 *                               type: string
 *                               nullable: true
 */
router.get('/sensor-latest', authenticateToken, async (req, res) => {
    try {
        const pool = getPool();
        const result = await pool.request().query(`
            SELECT
                s.Id AS StationId,
                s.Name AS StationName,
                s.Status,
                s.Location,
                s.Latitude,
                s.Longitude,
                st.Id AS SensorTypeId,
                st.Name AS SensorName,
                st.Unit,
                sr.Value,
                sr.RecordedAt,
                th.Level AS ThresholdLevel,
                th.MinValue AS ThresholdMin,
                th.MaxValue AS ThresholdMax
            FROM Stations s
            JOIN StationSensors ss ON s.Id = ss.StationId
            JOIN SensorTypes st ON ss.SensorTypeId = st.Id
            OUTER APPLY (
                SELECT TOP 1 Value, RecordedAt
                FROM SensorReadings
                WHERE StationId = s.Id AND SensorTypeId = st.Id
                ORDER BY RecordedAt DESC
            ) sr
            OUTER APPLY (
                SELECT TOP 1 Level, MinValue, MaxValue
                FROM SensorThresholds
                WHERE SensorTypeId = st.Id
                    AND sr.Value IS NOT NULL
                    AND ( (MinValue IS NULL OR sr.Value >= MinValue) AND (MaxValue IS NULL OR sr.Value < MaxValue) )
                ORDER BY Level
            ) th
            ORDER BY s.Id, st.Id
        `);
        const stationsMap = {};
        for (const row of result.recordset) {
            if (!row.StationId || isNaN(Number(row.StationId))) {
                continue;
            }
            if (!stationsMap[row.StationId]) {
                stationsMap[row.StationId] = {
                    id: row.StationId,
                    name: row.StationName,
                    status: row.Status,
                    statusText: row.Status === 'active' ? 'Hoạt động' : (row.Status === 'maintenance' ? 'Bảo trì' : 'Ngừng hoạt động'),
                    location: row.Location,
                    latitude: row.Latitude,
                    longitude: row.Longitude,
                    sensors: []
                };
            }
            stationsMap[row.StationId].sensors.push({
                id: row.SensorTypeId,
                name: row.SensorName,
                value: row.Value,
                unit: row.Unit,
                recordedAt: row.RecordedAt,
                level: row.ThresholdLevel !== undefined ? row.ThresholdLevel : null
            });
        }
        const stations = Object.values(stationsMap);
        res.json({
            success: true,
            data: stations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

module.exports = router; 