const { sql } = require('../config/database');

/**
 * Batch insert sensor readings using optimized batch insert with deadlock prevention
 * This is more efficient than individual inserts and reduces lock contention
 */
async function batchInsertReadings(transaction, readings) {
  if (readings.length === 0) return [];

  // Use batch insert with TABLOCK hint to reduce lock contention
  const values = readings.map((reading, index) => 
    `(@StationId${index}, @SensorTypeId${index}, @Value${index}, @RecordedAt${index})`
  ).join(',');

  const batchQuery = `
    INSERT INTO SensorReadings WITH (TABLOCK) (StationId, SensorTypeId, Value, RecordedAt) 
    OUTPUT INSERTED.* 
    VALUES ${values}
  `;

  const request = transaction.request();
  
  // Add parameters for each reading
  readings.forEach((reading, index) => {
    request.input(`StationId${index}`, sql.Int, reading.StationId)
           .input(`SensorTypeId${index}`, sql.Int, reading.SensorTypeId)
           .input(`Value${index}`, sql.Float, reading.Value)
           .input(`RecordedAt${index}`, sql.DateTime, reading.RecordedAt);
  });

  const result = await request.query(batchQuery);
  return result.recordset;
}

/**
 * Batch update statistics using MERGE statement with deadlock prevention
 * Logic: 
 * - Nếu CHƯA có bản ghi (StationId, SensorTypeId, StatDate) → INSERT mới
 * - Nếu ĐÃ có bản ghi → UPDATE AvgValue với số liệu mới
 */
async function batchUpdateStatistics(transaction, statistics) {
  if (statistics.length === 0) return;

  let insertCount = 0;
  let updateCount = 0;

  // Xử lý từng statistic để có logging chi tiết
  for (const stat of statistics) {
    // Kiểm tra xem đã có bản ghi này chưa
    const existingCheck = await transaction.request()
      .input('checkStationId', sql.Int, stat.StationId)
      .input('checkSensorTypeId', sql.Int, stat.SensorTypeId)
      .input('checkStatDate', sql.Date, stat.StatDate)
      .query(`
        SELECT Id, AvgValue 
        FROM StationStatistics 
        WHERE StationId = @checkStationId 
          AND SensorTypeId = @checkSensorTypeId 
          AND StatDate = @checkStatDate
      `);

    const isExisting = existingCheck.recordset.length > 0;
    const oldValue = isExisting ? existingCheck.recordset[0].AvgValue : null;

    // Thực hiện MERGE với UPDLOCK để tránh deadlock
    const mergeQuery = `
      MERGE StationStatistics WITH (UPDLOCK, HOLDLOCK) AS target
      USING (SELECT @StationId as StationId, @SensorTypeId as SensorTypeId, @StatDate as StatDate, @AvgValue as AvgValue) AS source
      ON (target.StationId = source.StationId AND target.SensorTypeId = source.SensorTypeId AND target.StatDate = source.StatDate)
      WHEN MATCHED THEN
        UPDATE SET AvgValue = source.AvgValue, CreatedAt = DATEADD(HOUR, 7, GETDATE())
      WHEN NOT MATCHED THEN
        INSERT (StationId, SensorTypeId, StatDate, AvgValue, CreatedAt)
        VALUES (source.StationId, source.SensorTypeId, source.StatDate, source.AvgValue, DATEADD(HOUR, 7, GETDATE()))
      OUTPUT $action as Action;
    `;

    const result = await transaction.request()
      .input('StationId', sql.Int, stat.StationId)
      .input('SensorTypeId', sql.Int, stat.SensorTypeId)
      .input('StatDate', sql.Date, stat.StatDate)
      .input('AvgValue', sql.Float, stat.AvgValue)
      .query(mergeQuery);

    // Logging chi tiết về operation
    const action = result.recordset[0]?.Action;
    if (action === 'UPDATE') {
      updateCount++;
      console.log(`    🔄 UPDATE: Station ${stat.StationId}, Sensor ${stat.SensorTypeId} → ${stat.AvgValue} (old: ${oldValue})`);
    } else if (action === 'INSERT') {
      insertCount++;
      console.log(`    ➕ INSERT: Station ${stat.StationId}, Sensor ${stat.SensorTypeId} → ${stat.AvgValue} (new record)`);
    }
  }

  // Tổng kết operations
  console.log(`    📊 Summary: ${insertCount} inserts, ${updateCount} updates`);
}

/**
 * Validate sensor readings data
 */
function validateReadings(readings) {
  const errors = [];

  if (!Array.isArray(readings)) {
    errors.push('Readings phải là một mảng');
    return errors;
  }
  if (readings.length === 0) {
    errors.push('Mảng readings không được rỗng');
    return errors;
  }

  readings.forEach((reading, index) => {
    if (typeof reading !== 'object' || reading === null) {
      errors.push(`Dữ liệu readings ở vị trí ${index} phải là một object`);
      return;
    }
    if (!reading.type || typeof reading.type !== 'string' || !reading.type.trim()) {
      errors.push(`Readings[${index}]: type phải là chuỗi không rỗng`);
    } else if (reading.type.length > 50) {
      errors.push(`Readings[${index}]: type quá dài (tối đa 50 ký tự)`);
    }
    if (!('value' in reading)) {
      errors.push(`Readings[${index}]: thiếu trường value`);
    } else if (typeof reading.value !== 'number' || !Number.isFinite(reading.value)) {
      errors.push(`Readings[${index}]: value phải là số hữu hạn`);
    }
    if (typeof reading.value === 'number' && reading.value < 0) {
      errors.push(`Readings[${index}]: value không được âm`);
    }
  });

  // Kiểm tra trùng lặp type
  const typeSet = new Set();
  readings.forEach((reading, index) => {
    if (reading && typeof reading.type === 'string') {
      const typeLower = reading.type.toLowerCase();
      if (typeSet.has(typeLower)) {
        errors.push(`Readings[${index}]: type "${reading.type}" bị trùng lặp`);
      } else {
        typeSet.add(typeLower);
      }
    }
  });

  return errors;
}

/**
 * Parse and validate timestamp
 */
function parseTimestamp(timestamp) {
  try {
    let time;
    
    if (timestamp) {
      // Client gửi timestamp - parse và validate
      time = new Date(timestamp);
      if (isNaN(time.getTime())) {
        throw new Error('Invalid timestamp format');
      }
      console.log(`📥 Received timestamp from client: ${time.toISOString()}`);
    } else {
      // Không có timestamp - sử dụng thời gian hiện tại của Việt Nam (UTC+7)
      const now = new Date();
      time = new Date(now.getTime() + 7 * 60 * 60 * 1000); // Chuyển sang UTC+7
      console.log(`🕐 Using current Vietnam time (UTC+7): ${time.toISOString()}`);
      console.log(`🇻🇳 Vietnam local time: ${time.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })}`);
    }
    
    return time;
  } catch (error) {
    throw new Error('Invalid timestamp format');
  }
}

module.exports = {
  batchInsertReadings,     // Dùng trong inputData.js
  batchUpdateStatistics,   // Dùng trong statisticsJob.js  
  validateReadings,        // Dùng trong inputData.js
  parseTimestamp          // Dùng trong inputData.js
}; 