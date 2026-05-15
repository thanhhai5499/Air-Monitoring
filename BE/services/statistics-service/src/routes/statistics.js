const express = require('express');
const { getPool, sql } = require('../config/database');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

/**
 * @swagger
 * /daily:
 *   get:
 *     summary: Lấy dữ liệu trung bình theo ngày cho trạm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *     responses:
 *       200:
 *         description: Dữ liệu trung bình ngày
 */
router.get('/daily', authenticateToken, async (req, res) => {
  try {
    const stationId = req.query.stationId;
    if (!stationId) return res.status(400).json({ success: false, message: 'Missing stationId' });
    const pool = await getPool();
    // Lấy danh sách sensor types cho trạm
    const sensorTypes = await pool.request()
      .input('stationId', sql.Int, stationId)
      .query(`
        SELECT st.Id, st.Name, st.Unit
        FROM StationSensors ss
        JOIN SensorTypes st ON ss.SensorTypeId = st.Id
        WHERE ss.StationId = @stationId
      `);
    // Lấy dữ liệu readings theo ngày trong tháng hiện tại
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    // Chuẩn bị dữ liệu động
    const data = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      const row = { date: day };
      for (const sensor of sensorTypes.recordset) {
        const reading = await pool.request()
          .input('stationId', sql.Int, stationId)
          .input('sensorTypeId', sql.Int, sensor.Id)
          .input('date', sql.Date, dateStr)
          .query(`
            SELECT AVG(Value) as avgValue
            FROM SensorReadings
            WHERE StationId = @stationId AND SensorTypeId = @sensorTypeId
              AND CAST(RecordedAt AS DATE) = @date
          `);
        row[sensor.Name] = reading.recordset[0].avgValue !== null ? Math.round(reading.recordset[0].avgValue * 100) / 100 : null;
      }
      data.push(row);
    }
    res.json(data);
  } catch (error) {
    console.error('Error in /daily:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /monthly:
 *   get:
 *     summary: Lấy dữ liệu trung bình theo tháng cho trạm
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *       - in: query
 *         name: year
 *         required: false
 *         schema:
 *           type: integer
 *         description: Năm cần lấy dữ liệu (mặc định năm hiện tại)
 *     responses:
 *       200:
 *         description: Dữ liệu trung bình tháng
 */
router.get('/monthly', authenticateToken, async (req, res) => {
  try {
    const stationId = req.query.stationId;
    if (!stationId) return res.status(400).json({ success: false, message: 'Missing stationId' });
    const yearParam = req.query.year;
    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    if (isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({ success: false, message: 'Invalid year' });
    }
    const pool = await getPool();
    // Lấy danh sách sensor types cho trạm
    const sensorTypes = await pool.request()
      .input('stationId', sql.Int, stationId)
      .query(`
        SELECT st.Id, st.Name, st.Unit
        FROM StationSensors ss
        JOIN SensorTypes st ON ss.SensorTypeId = st.Id
        WHERE ss.StationId = @stationId
      `);
    const data = [];
    for (let month = 1; month <= 12; month++) {
      const row = { month: new Date(year, month - 1).toLocaleString('en', { month: 'short' }) };
      for (const sensor of sensorTypes.recordset) {
        const reading = await pool.request()
          .input('stationId', sql.Int, stationId)
          .input('sensorTypeId', sql.Int, sensor.Id)
          .input('year', sql.Int, year)
          .input('month', sql.Int, month)
          .query(`
            SELECT AVG(Value) as avgValue
            FROM SensorReadings
            WHERE StationId = @stationId AND SensorTypeId = @sensorTypeId
              AND YEAR(RecordedAt) = @year AND MONTH(RecordedAt) = @month
          `);
        row[sensor.Name] = reading.recordset[0].avgValue !== null ? Math.round(reading.recordset[0].avgValue * 100) / 100 : null;
      }
      data.push(row);
    }
    res.json(data);
  } catch (error) {
    console.error('Error in /monthly:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /hourly:
 *   get:
 *     summary: Lấy dữ liệu theo giờ trong 7 ngày gần nhất
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *       - in: query
 *         name: sensorType
 *         required: false
 *         schema:
 *           type: string
 *         description: Tên sensor type (PM2.5, PM10, UV, etc.)
 *       - in: query
 *         name: days
 *         required: false
 *         schema:
 *           type: integer
 *         description: Số ngày lấy dữ liệu (mặc định 7)
 *     responses:
 *       200:
 *         description: Dữ liệu theo giờ
 */
router.get('/hourly', authenticateToken, async (req, res) => {
  try {
    const { stationId, sensorType = 'PM2.5', days = 7 } = req.query;
    if (!stationId) return res.status(400).json({ success: false, message: 'Missing stationId' });
    
    const pool = await getPool();
    
    // Lấy dữ liệu theo giờ trong N ngày gần nhất
    const result = await pool.request()
      .input('stationId', sql.Int, stationId)
      .input('sensorType', sql.VarChar, sensorType)
      .input('days', sql.Int, days)
      .query(`
        WITH HourlyData AS (
          SELECT 
            CAST(sr.RecordedAt AS DATE) as Date,
            DATEPART(HOUR, sr.RecordedAt) as Hour,
            AVG(sr.Value) as AvgValue
          FROM SensorReadings sr
          JOIN StationSensors ss ON sr.StationId = ss.StationId AND sr.SensorTypeId = ss.SensorTypeId
          JOIN SensorTypes st ON ss.SensorTypeId = st.Id
          WHERE ss.StationId = @stationId
            AND st.Name = @sensorType
            AND sr.RecordedAt >= DATEADD(day, -@days, CAST(GETDATE() AS DATE))
          GROUP BY CAST(sr.RecordedAt AS DATE), DATEPART(HOUR, sr.RecordedAt)
        )
        SELECT 
          Date,
          Hour,
          ROUND(AvgValue, 1) as Value
        FROM HourlyData
        ORDER BY Date DESC, Hour
      `);
    
    // Transform data thành format { date, hourlyValues: [{hour, value}] }
    const dataByDate = {};
    result.recordset.forEach(row => {
      const dateKey = row.Date.toISOString().split('T')[0];
      if (!dataByDate[dateKey]) {
        dataByDate[dateKey] = { date: dateKey, hourlyValues: [] };
      }
      dataByDate[dateKey].hourlyValues.push({
        hour: row.Hour,
        value: row.Value || 0
      });
    });
    
    const finalData = Object.values(dataByDate);
    res.json({ success: true, data: finalData });
  } catch (error) {
    console.error('Error in /hourly:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /distribution:
 *   get:
 *     summary: Lấy phân bố % các mức độ chất lượng không khí
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: stationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *       - in: query
 *         name: sensorType
 *         required: false
 *         schema:
 *           type: string
 *         description: Tên sensor type (PM2.5, PM10, etc.)
 *       - in: query
 *         name: period
 *         required: false
 *         schema:
 *           type: string
 *         description: Khoảng thời gian (month, year)
 *     responses:
 *       200:
 *         description: Phân bố mức độ chất lượng
 */
router.get('/distribution', authenticateToken, async (req, res) => {
  try {
    const { stationId, sensorType = 'PM2.5', period = 'month' } = req.query;
    if (!stationId) return res.status(400).json({ success: false, message: 'Missing stationId' });
    
    const pool = await getPool();
    
    // Xác định khoảng thời gian
    // month: từ ngày 1 tháng này đến hôm nay (đúng "tháng này")
    // year: từ ngày 1 tháng 1 năm nay đến hôm nay
    let dateFilter = '';
    if (period === 'month') {
      dateFilter = 'AND sr.RecordedAt >= DATEFROMPARTS(YEAR(GETDATE()), MONTH(GETDATE()), 1) AND sr.RecordedAt < DATEADD(day, 1, CAST(GETDATE() AS DATE))';
    } else if (period === 'year') {
      dateFilter = 'AND sr.RecordedAt >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1) AND sr.RecordedAt < DATEADD(day, 1, CAST(GETDATE() AS DATE))';
    }
    
    // Lấy phân bố theo level (dựa trên SensorThresholds)
    const result = await pool.request()
      .input('stationId', sql.Int, stationId)
      .input('sensorType', sql.VarChar, sensorType)
      .query(`
        WITH DailyAvg AS (
          SELECT 
            CAST(sr.RecordedAt AS DATE) as Date,
            AVG(sr.Value) as AvgValue
          FROM SensorReadings sr
          JOIN StationSensors ss ON sr.StationId = ss.StationId AND sr.SensorTypeId = ss.SensorTypeId
          JOIN SensorTypes st ON ss.SensorTypeId = st.Id
          WHERE ss.StationId = @stationId
            AND st.Name = @sensorType
            ${dateFilter}
          GROUP BY CAST(sr.RecordedAt AS DATE)
        ),
        LevelCounts AS (
          SELECT 
            COUNT(*) as Total,
            SUM(CASE WHEN AvgValue < 25 THEN 1 ELSE 0 END) as Level1,
            SUM(CASE WHEN AvgValue >= 25 AND AvgValue < 50 THEN 1 ELSE 0 END) as Level2,
            SUM(CASE WHEN AvgValue >= 50 AND AvgValue < 90 THEN 1 ELSE 0 END) as Level3,
            SUM(CASE WHEN AvgValue >= 90 THEN 1 ELSE 0 END) as Level4
          FROM DailyAvg
        )
        SELECT 
          Total,
          Level1,
          Level2,
          Level3,
          Level4,
          CAST(ROUND(Level1 * 100.0 / NULLIF(Total, 0), 1) AS DECIMAL(5,1)) as Level1Percent,
          CAST(ROUND(Level2 * 100.0 / NULLIF(Total, 0), 1) AS DECIMAL(5,1)) as Level2Percent,
          CAST(ROUND(Level3 * 100.0 / NULLIF(Total, 0), 1) AS DECIMAL(5,1)) as Level3Percent,
          CAST(ROUND(Level4 * 100.0 / NULLIF(Total, 0), 1) AS DECIMAL(5,1)) as Level4Percent
        FROM LevelCounts
      `);
    
    const data = result.recordset[0] || {
      Total: 0,
      Level1: 0, Level2: 0, Level3: 0, Level4: 0,
      Level1Percent: 0, Level2Percent: 0, Level3Percent: 0, Level4Percent: 0
    };
    
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error in /distribution:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router; 