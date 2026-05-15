const { connectDB, getPool, sql } = require('./config/database');

/**
 * JOB TỰ ĐỘNG CẬP NHẬT STATUS CỦA MANAGER KHI HẾT HẠN
 * 
 * LOGIC:
 * 1. Lấy tất cả manager có ValidTo < ngày hiện tại và status = 'active'
 * 2. Cập nhật status = 'pending' cho các manager đó (để có thể gửi yêu cầu gia hạn)
 */
async function checkAndUpdateExpiredManagers() {
  try {
    const pool = getPool();
    if (!pool) {
      console.log('⚠️ Database pool chưa sẵn sàng, bỏ qua lần kiểm tra này');
      return;
    }

    // Đảm bảo các cột ValidFrom và ValidTo tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ValidFrom')
        BEGIN
          ALTER TABLE Users ADD ValidFrom DATETIME NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Users') AND name = 'ValidTo')
        BEGIN
          ALTER TABLE Users ADD ValidTo DATETIME NULL
        END
      `);
    } catch (alterError) {
      // Columns might already exist
    }

    // Lấy giờ Việt Nam hiện tại
    const now = new Date();
    const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    
    // Tìm các manager đã hết hạn (ValidTo < now và status = 'active')
    const expiredManagers = await pool.request()
      .input('currentTime', sql.DateTime, vietnamTime)
      .query(`
        SELECT u.Id, u.Username, u.FullName, u.ValidTo
        FROM Users u
        INNER JOIN Roles r ON u.RoleId = r.Id
        WHERE r.Name = 'manager' 
          AND u.Status = 'active'
          AND u.ValidTo IS NOT NULL
          AND u.ValidTo < @currentTime
      `);

    if (expiredManagers.recordset.length > 0) {
      console.log(`⏰ Tìm thấy ${expiredManagers.recordset.length} manager đã hết hạn sử dụng`);
      
      // Cập nhật status = 'pending' cho các manager đã hết hạn (để có thể gửi yêu cầu gia hạn)
      for (const manager of expiredManagers.recordset) {
        await pool.request()
          .input('id', sql.Int, manager.Id)
          .query(`
            UPDATE Users 
            SET Status = 'pending' 
            WHERE Id = @id
          `);
        console.log(`✅ Đã cập nhật status = pending cho manager: ${manager.Username} (${manager.FullName}) - Hết hạn: ${manager.ValidTo}`);
      }
    } else {
      console.log('✅ Không có manager nào hết hạn');
    }
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra và cập nhật manager hết hạn:', error.message);
  }
}

// Export function để có thể gọi từ server.js
module.exports = { checkAndUpdateExpiredManagers };
