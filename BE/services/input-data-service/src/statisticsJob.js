const { connectDB, getPool, sql } = require('./config/database');
const { batchUpdateStatistics } = require('./utils/batchOperations');

/**
 * CẬP NHẬT STATISTICS CHO TẤT CẢ TRẠM
 * 
 * LOGIC:
 * 1. Lấy ngày hiện tại (VN timezone)
 * 2. Với mỗi trạm, tính AVG cho tất cả sensor types trong ngày đó
 * 3. Nếu CHƯA có record (StationId, SensorTypeId, StatDate) → INSERT mới
 * 4. Nếu ĐÃ có record → UPDATE với AVG mới (tính lại từ tất cả readings)
 */
async function updateAllStationStatistics() {
  const pool = getPool();
  try {
    // Lấy tất cả các trạm active
    const stationsRes = await pool.request().query("SELECT Id, Name FROM Stations WHERE Status = 'active'");
    const stations = stationsRes.recordset;
    if (stations.length === 0) {
      console.log('❌ Không có trạm nào active');
      return;
    }

    // Lấy tất cả sensor types
    const sensorTypesRes = await pool.request().query('SELECT Id, Name FROM SensorTypes');
    const sensorTypes = sensorTypesRes.recordset;
    if (sensorTypes.length === 0) {
      console.log('❌ Không có sensor type nào');
      return;
    }

    console.log(`📊 Có ${stations.length} trạm và ${sensorTypes.length} sensor types`);
    console.log(`🎯 Mục đích: Tính trung bình cho ${stations.length * sensorTypes.length} statistics của NGÀY HIỆN TẠI`);

    // ===== TÍNH NGÀY HIỆN TẠI (VN TIMEZONE) =====
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    const year = vietnamTime.getFullYear();
    const month = vietnamTime.getMonth(); // 0-based
    const date = vietnamTime.getDate();
    
    // Khoảng thời gian: 00:00:00 VN → 23:59:59 VN (chuyển về UTC để query)
    const startOfDayVN = new Date(year, month, date, 0, 0, 0, 0);
    const endOfDayVN = new Date(year, month, date, 23, 59, 59, 999);
    startOfDayVN.setTime(startOfDayVN.getTime() - 7 * 60 * 60 * 1000);
    endOfDayVN.setTime(endOfDayVN.getTime() - 7 * 60 * 60 * 1000);
    
    // StatDate: YYYY-MM-DD format cho database
    const statDate = `${year}-${(month + 1).toString().padStart(2, '0')}-${date.toString().padStart(2, '0')}`;

    console.log(`\n📅 NGÀY HIỆN TẠI: ${statDate} (VN: ${vietnamTime.toLocaleString('vi-VN')})`);
    console.log(`⏰ Khoảng thời gian readings (UTC): ${startOfDayVN.toISOString()} → ${endOfDayVN.toISOString()}`);
    
    // Kiểm tra hiện tại có bao nhiêu statistics cho ngày này
    const currentCountRes = await pool.request()
      .input('statDate', sql.Date, statDate)
      .query('SELECT COUNT(*) as currentCount FROM StationStatistics WHERE StatDate = @statDate');
    const currentCount = currentCountRes.recordset[0].currentCount;
    console.log(`📈 Hiện có ${currentCount} statistics records cho ngày ${statDate}`);

    let totalProcessed = 0;

    // ===== XỬ LÝ TỪNG TRẠM =====
    for (const station of stations) {
      const stationId = station.Id;
      const stationName = station.Name;
      
      let attempt = 0, success = false;
      while (!success && attempt < 3) {
        const transaction = new sql.Transaction(pool);
        try {
          await transaction.begin();
          
          console.log(`\n🏭 Station ${stationId} (${stationName}) - Processing...`);
          
          // ===== TÍNH TRUNG BÌNH CHO NGÀY HIỆN TẠI =====
          const avgQuery = `
            SELECT 
              SensorTypeId,
              ROUND(AVG(Value), 0) as AvgValue,
              COUNT(*) as ReadingCount,
              MIN(RecordedAt) as FirstReading,
              MAX(RecordedAt) as LastReading
            FROM SensorReadings 
            WHERE StationId = @StationId 
              AND RecordedAt >= @start 
              AND RecordedAt <= @end
            GROUP BY SensorTypeId
          `;

          const avgResult = await transaction.request()
            .input('StationId', sql.Int, stationId)
            .input('start', sql.DateTime, startOfDayVN)
            .input('end', sql.DateTime, endOfDayVN)
            .query(avgQuery);

          console.log(`  📊 Có ${avgResult.recordset.length} sensor types có dữ liệu readings`);

          // Tạo map dữ liệu có sẵn từ readings
          const readingsMap = new Map();
          avgResult.recordset.forEach(row => {
            readingsMap.set(row.SensorTypeId, {
              avgValue: row.AvgValue,
              count: row.ReadingCount,
              firstReading: row.FirstReading,
              lastReading: row.LastReading
            });
          });

          // ===== TẠO STATISTICS CHO TẤT CẢ 4 SENSOR TYPES =====
          const allStatistics = [];
          
          for (const sensorType of sensorTypes) {
            const sensorTypeId = sensorType.Id;
            const sensorTypeName = sensorType.Name;
            
            let avgValue;
            
            if (readingsMap.has(sensorTypeId)) {
              // CÓ DỮ LIỆU READINGS → DÙNG TRUNG BÌNH THỰC TỪ DATABASE
              const data = readingsMap.get(sensorTypeId);
              avgValue = data.avgValue;
              const readingRange = `${data.firstReading?.toLocaleString('vi-VN')} → ${data.lastReading?.toLocaleString('vi-VN')}`;
              console.log(`  ✅ ${sensorTypeName}: ${avgValue} (từ ${data.count} readings, range: ${readingRange})`);
            } else {
              // KHÔNG CÓ READINGS → DÙNG GIÁ TRỊ MẶC ĐỊNH
              avgValue = getDefaultValue(sensorTypeId);
              console.log(`  📝 ${sensorTypeName}: ${avgValue} (default - không có readings)`);
            }
            
            // Chuẩn bị data cho MERGE operation
            allStatistics.push({
              StationId: stationId,
              SensorTypeId: sensorTypeId,
              StatDate: statDate,  // CHỈ LƯU CHO NGÀY HIỆN TẠI
              AvgValue: avgValue
            });
          }
          
          // ===== LƯU VÀO DATABASE (INSERT/UPDATE) =====
          if (allStatistics.length > 0) {
            console.log(`  💾 Saving ${allStatistics.length} statistics for date: ${statDate}`);
            await batchUpdateStatistics(transaction, allStatistics);
            totalProcessed += allStatistics.length;
          }
          
          await transaction.commit();
          success = true;
        } catch (err) {
          await transaction.rollback();
          attempt++;
          console.error(`❌ Lỗi station ${stationId}, lần thử ${attempt}: ${err.message}`);
          if (attempt < 3) {
            await new Promise(res => setTimeout(res, 200 * attempt));
          }
        }
      }
    }

    // ===== KIỂM TRA KẾT QUẢ CUỐI CÙNG =====
    const finalCheck = await pool.request()
      .input('statDate', sql.Date, statDate)
      .query(`
        SELECT 
          COUNT(*) as total,
          COUNT(DISTINCT StationId) as uniqueStations,
          COUNT(DISTINCT SensorTypeId) as uniqueSensorTypes,
          MIN(AvgValue) as minAvg,
          MAX(AvgValue) as maxAvg
        FROM StationStatistics 
        WHERE StatDate = @statDate
      `);

    const result = finalCheck.recordset[0];
    const expectedRecords = stations.length * sensorTypes.length;
    
    console.log(`\n🎯 KẾT QUẢ CHO NGÀY ${statDate}:`);
    console.log(`  📊 Records trong DB: ${result.total}/${expectedRecords}`);
    console.log(`  🏭 Unique stations: ${result.uniqueStations}/${stations.length}`);
    console.log(`  🔧 Unique sensor types: ${result.uniqueSensorTypes}/${sensorTypes.length}`);
    console.log(`  📈 Range giá trị: ${result.minAvg} - ${result.maxAvg}`);
    console.log(`  ✅ Đã process: ${totalProcessed} statistics`);
    
    if (result.total === expectedRecords) {
      console.log(`  🎉 HOÀN THÀNH! Đầy đủ ${expectedRecords} statistics cho ngày ${statDate}`);
    } else {
      console.log(`  ⚠️ Thiếu ${expectedRecords - result.total} records cho ngày ${statDate}`);
    }
    
  } catch (err) {
    console.error('💥 Lỗi tổng thể:', err.message);
  }
}

// Giá trị mặc định khi không có dữ liệu readings cho sensor type
function getDefaultValue(sensorTypeId) {
  const defaults = {
    1: 5,     // UV: 5 index (mức an toàn)
    2: 25,    // PM2.5: 25 µg/m3 (mức trung bình)
    3: 40,    // PM10: 40 µg/m3 (mức trung bình)
    4: 3000   // Battery: 3000 mV (mức trung bình)
  };
  return defaults[sensorTypeId] || 0;
}

// Khởi động job
(async () => {
  try {
    await connectDB();
    console.log('🚀 Statistics Job - Tính trung bình cho StationStatistics');
    console.log('🎯 Logic: INSERT mới nếu chưa có, UPDATE nếu đã có bản ghi');
    console.log('📅 Chỉ xử lý dữ liệu của NGÀY HIỆN TẠI');
    console.log('🔄 Chạy mỗi 60 giây để cập nhật real-time\n');
    
    // Chạy ngay khi start
    updateAllStationStatistics();
    
    // Lặp mỗi 60 giây
    setInterval(updateAllStationStatistics, 60000);
    
  } catch (err) {
    console.error('💥 Không thể khởi động:', err.message);
    process.exit(1);
  }
})();