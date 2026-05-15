const express = require('express');
const apiKeyAuth = require('../middleware/apiKeyAuth');
const { getPool, sql } = require('../config/database');
const { sensorTypeCache } = require('../utils/cache');
const { 
  batchInsertReadings, 
  batchUpdateStatistics, 
  calculateAverages, 
  validateReadings, 
  parseTimestamp 
} = require('../utils/batchOperations');
const router = express.Router();

/**
 * @swagger
 * /:
 *   post:
 *     summary: Nhận dữ liệu từ bên ngoài (sensor, thiết bị, ...)
 *     tags: [InputData]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               device_name:
 *                 type: string
 *               readings:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                     value:
 *                       type: number
 *             required:
 *               - device_name
 *               - readings
 *     responses:
 *       200:
 *         description: Nhận dữ liệu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Sai hoặc thiếu API Key
 *       500:
 *         description: Lỗi server
 */
router.post('/', apiKeyAuth, async (req, res) => {
  let pool;
  try {
    pool = getPool();
  } catch (err) {
    return res.status(500).json({ error: { code: 500, message: 'Lỗi kết nối database', details: err.message } });
  }
  const maxRetry = 3;
  let attempt = 0;
  let lastError = null;

  // Validate body structure
  if (!req.body || typeof req.body !== 'object') {
    return res.status(400).json({ error: { code: 400, message: 'Cấu trúc gửi đi bị sai' } });
  }
  const { device_name, timestamp, readings } = req.body;

  // Validate device_name
  if (!device_name || typeof device_name !== 'string') {
    return res.status(400).json({ error: { code: 400, message: 'Trạm này không tồn tại' } });
  }

  // Validate readings tồn tại
  if (!('readings' in req.body)) {
    return res.status(400).json({ error: { code: 400, message: 'Không có sensor nào được thêm' } });
  }

  // Validate readings là mảng
  if (!Array.isArray(readings)) {
    return res.status(400).json({ error: { code: 400, message: 'Cấu trúc gửi đi bị sai' } });
  }

  // Validate readings không rỗng
  if (readings.length === 0) {
    return res.status(400).json({ error: { code: 400, message: 'Không có sensor nào được thêm' } });
  }

  // Validate từng phần tử readings
  const validationErrors = validateReadings(readings);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: { code: 400, message: 'Cấu trúc gửi đi bị sai', details: validationErrors } });
  }

  // Parse timestamp
  let time;
  try {
    time = parseTimestamp(timestamp);
  } catch (error) {
    return res.status(400).json({ error: { code: 400, message: 'Cấu trúc gửi đi bị sai' } });
  }

  while (attempt < maxRetry) {
    let transaction;
    try {
      transaction = new sql.Transaction(pool);
      await transaction.begin();

      // Find stationId by device_name
      const stationRes = await transaction.request()
        .input('name', sql.NVarChar, device_name)
        .query('SELECT Id, Status FROM Stations WHERE Name = @name');
      if (stationRes.recordset.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Trạm này không tồn tại' } });
      }
      const station = stationRes.recordset[0];
      if (station.Status && station.Status.toLowerCase() === 'inactive') {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Trạm đã ngừng hoạt động, không thể thêm dữ liệu.' } });
      }
      if (station.Status && station.Status.toLowerCase() !== 'active') {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Trạm này không tồn tại' } });
      }
      const stationId = station.Id;

      // Get sensor types from cache
      const typeMap = await sensorTypeCache.getSensorTypes();

      // Lấy danh sách sensor typeId mà trạm này quản lý
      const stationSensorsRes = await transaction.request()
        .input('stationId', sql.Int, stationId)
        .query('SELECT SensorTypeId FROM StationSensors WHERE StationId = @stationId');
      const stationSensorTypeIds = stationSensorsRes.recordset.map(row => row.SensorTypeId);
      if (stationSensorTypeIds.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Trạm này chưa có sensor nào' } });
      }
      // Map sensorTypeId -> sensorName
      const sensorTypeIdToName = {};
      for (const [name, id] of typeMap.entries()) {
        sensorTypeIdToName[id] = name;
      }
      // Lọc readings hợp lệ (sensor thuộc trạm)
      const validReadings = [];
      const validSensorNames = [];
      const invalidSensorNames = [];
      for (const r of readings) {
        const typeId = typeMap.get(r.type.toLowerCase());
        if (!typeId || !stationSensorTypeIds.includes(typeId)) {
          invalidSensorNames.push(r.type);
          continue;
        }
        validReadings.push({
          StationId: stationId,
          SensorTypeId: typeId,
          Value: r.value,
          RecordedAt: time
        });
        validSensorNames.push(r.type);
      }
      // Nếu có sensor không thuộc trạm, báo lỗi luôn
      if (invalidSensorNames.length > 0) {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Trạm này không có những sensor này', details: invalidSensorNames } });
      }
      // Nếu không có sensor hợp lệ
      if (validReadings.length === 0) {
        await transaction.rollback();
        return res.status(400).json({ error: { code: 400, message: 'Không có sensor nào được thêm' } });
      }
      // Nếu gửi thiếu sensor, vẫn cho add nhưng báo chỉ có những sensor này được thêm
      if (validReadings.length < stationSensorTypeIds.length) {
        await batchInsertReadings(transaction, validReadings);
        await transaction.commit();
        return res.json({
          device_name,
          timestamp: time.toISOString(),
          readings: validReadings.map(reading => ({
            type: sensorTypeIdToName[reading.SensorTypeId],
            value: reading.Value
          })),
          message: 'Chỉ có những sensor này được thêm: ' + validSensorNames.join(', ')
        });
      }
      // Nếu gửi đủ sensor
      if (validReadings.length === stationSensorTypeIds.length) {
        await batchInsertReadings(transaction, validReadings);
        await transaction.commit();
        return res.json({
          device_name,
          timestamp: time.toISOString(),
          readings: validReadings.map(reading => ({
            type: sensorTypeIdToName[reading.SensorTypeId],
            value: reading.Value
          })),
          message: 'Thêm dữ liệu mới thành công'
        });
      }
    } catch (error) {
      try {
        if (transaction) await transaction.rollback();
      } catch (rollbackErr) {
        console.error('❌ Error during transaction rollback:', rollbackErr);
      }
      lastError = error;
      const isDeadlock = String(error.message).toLowerCase().includes('deadlock');
      if (isDeadlock) {
        attempt++;
        await new Promise(res => setTimeout(res, 300 * attempt));
        continue;
      } else {
        break;
      }
    }
  }
  // Nếu hết retry vẫn lỗi
  console.error('❌ InputData API error:', lastError);
  res.status(500).json({
    error: {
      code: 500,
      message: 'Internal server error',
      details: lastError ? lastError.message : 'Unknown error'
    }
  });
});

module.exports = router; 