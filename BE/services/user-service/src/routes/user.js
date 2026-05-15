const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const router = express.Router();

// Sử dụng middleware xác thực JWT từ middleware/auth.js
const authMiddleware = require('../middleware/auth');

// Middleware kiểm tra quyền admin
function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Chỉ admin mới có quyền sử dụng chức năng này' });
  }
  next();
}

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Lấy thông tin người dùng hiện tại
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thông tin người dùng thành công
 *       401:
 *         description: Không có hoặc sai token truy cập
 *       404:
 *         description: Không tìm thấy người dùng
 */
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const pool = getPool();
    const user = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query(`
        SELECT u.Id, u.Username, u.Email, u.FullName, u.Status, u.CreatedAt, u.LastLoginAt, r.Name as Role, u.Phone, u.Organization, u.Position
        FROM Users u LEFT JOIN Roles r ON u.RoleId = r.Id WHERE u.Id = @userId
      `);
    if (user.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, data: user.recordset[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /change-password:
 *   post:
 *     summary: Đổi mật khẩu
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đổi mật khẩu thành công
 *       400:
 *         description: Lỗi xác thực hoặc mật khẩu không đúng
 *       401:
 *         description: Không có hoặc sai token truy cập
 */
router.post('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, message: 'Validation errors', errors: errors.array() });
    }
    const { currentPassword, newPassword } = req.body;
    const pool = getPool();
    // Lấy user hiện tại
    const user = await pool.request()
      .input('userId', sql.Int, req.user.id)
      .query('SELECT id, password FROM Users WHERE id = @userId');
    if (user.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const bcrypt = require('bcryptjs');
    const userData = user.recordset[0];
    // Kiểm tra mật khẩu hiện tại
    const isValidPassword = await bcrypt.compare(currentPassword, userData.password);
    if (!isValidPassword) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }
    // Hash mật khẩu mới
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.request()
      .input('userId', sql.Int, req.user.id)
      .input('password', sql.VarChar, hashedPassword)
      .query('UPDATE Users SET password = @password WHERE id = @userId');
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /profile:
 *   put:
 *     summary: Cập nhật thông tin cá nhân user hiện tại
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               FullName:
 *                 type: string
 *               Email:
 *                 type: string
 *               Phone:
 *                 type: string
 *               Organization:
 *                 type: string
 *               Position:
 *                 type: string
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy user
 */
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const userId = Number(req.user.id);
    const { FullName, Email, Phone, Organization, Position } = req.body;
    const pool = getPool();
    const check = await pool.request().input('userId', sql.Int, userId).query('SELECT Id FROM Users WHERE Id = @userId');
    if (check.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    await pool.request()
      .input('userId', sql.Int, userId)
      .input('FullName', sql.NVarChar, FullName)
      .input('Email', sql.NVarChar, Email)
      .input('Phone', sql.NVarChar, Phone)
      .input('Organization', sql.NVarChar, Organization)
      .input('Position', sql.NVarChar, Position)
      .query('UPDATE Users SET FullName = @FullName, Email = @Email, Phone = @Phone, Organization = @Organization, Position = @Position WHERE Id = @userId');
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /managers:
 *   get:
 *     summary: Lấy danh sách tài khoản quản lý (role = 'manager') kèm lịch sử đăng nhập gần nhất
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Danh sách tài khoản quản lý
 */
router.get('/managers', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
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
      console.log('Columns might already exist:', alterError.message);
    }
    
    const result = await pool.request().query(`
      SELECT 
        u.Id, u.Username, u.Email, u.FullName, u.Organization, u.Position, u.Phone, 
        r.Name AS Role, u.Status, u.lastLoginAt, u.ValidFrom, u.ValidTo
      FROM Users u
      JOIN Roles r ON u.RoleId = r.Id
      WHERE r.Name = 'manager'
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /google:
 *   get:
 *     summary: Lấy danh sách tài khoản đăng nhập bằng Google kèm lịch sử đăng nhập gần nhất
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Danh sách tài khoản Google
 */
router.get('/google', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    const result = await pool.request().query(`
      SELECT 
        u.Id, u.Username, u.Email, u.FullName, u.Organization, u.Position, u.Phone, 
        r.Name AS Role, u.Status, u.lastLoginAt
      FROM Users u
      JOIN Roles r ON u.RoleId = r.Id
      WHERE r.Name = 'user' AND u.GoogleId IS NOT NULL
    `);
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái tài khoản (chỉ cho phép Active/Inactivate)
 *     tags: [User]
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
 *               status:
 *                 type: string
 *                 enum: [Active, Inactive]
 *     responses:
 *       200:
 *         description: Cập nhật trạng thái thành công
 *       400:
 *         description: Trạng thái không hợp lệ
 *       404:
 *         description: Không tìm thấy user
 */
router.put('/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    let { status } = req.body;
    const { id } = req.params;
    // Chỉ cho phép 'active' hoặc 'inactive' (chữ thường, không phân biệt hoa/thường)
    status = (status || '').toLowerCase();
    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Chỉ cho phép cập nhật status active hoặc inactive' });
    }
    const pool = getPool();
    const check = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT Id, Status, ValidTo, RoleId FROM Users WHERE Id = @id');
    if (check.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const user = check.recordset[0];
    const roleCheck = await pool.request()
      .input('roleId', sql.Int, user.RoleId)
      .query('SELECT Name FROM Roles WHERE Id = @roleId');
    const roleName = roleCheck.recordset[0]?.Name || '';

    // Khi active thì admin KHÔNG được chuyển sang inactive (chỉ được khi pending)
    if (status === 'inactive' && user.Status === 'active') {
      const now = new Date();
      const validTo = user.ValidTo ? new Date(user.ValidTo) : null;
      const isExpired = validTo && validTo < now;
      if (roleName === 'manager' && validTo && !isExpired) {
        return res.status(400).json({
          success: false,
          message: 'Không thể chuyển tài khoản đang hoạt động sang ngừng hoạt động. Chỉ có thể chuyển khi tài khoản ở trạng thái Chờ duyệt.'
        });
      }
    }

    await pool.request()
      .input('id', sql.Int, id)
      .input('status', sql.NVarChar, status)
      .query('UPDATE Users SET Status = @status WHERE Id = @id');
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /extension-requests:
 *   post:
 *     summary: Manager gửi yêu cầu gia hạn (không cần auth vì đã hết hạn)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - description
 *               - requestedValidFrom
 *               - requestedValidTo
 *             properties:
 *               userId:
 *                 type: integer
 *               description:
 *                 type: string
 *               requestedValidFrom:
 *                 type: string
 *                 format: date-time
 *               requestedValidTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Gửi yêu cầu thành công
 *       400:
 *         description: Dữ liệu không hợp lệ
 */
// Yêu cầu JWT authentication - chỉ manager đã đăng nhập mới có thể gửi yêu cầu
router.post('/extension-requests', authMiddleware, async (req, res) => {
  try {
    // Lấy userId từ JWT token thay vì từ body để đảm bảo security
    const userId = req.user.id;
    const { description, requestedValidFrom, requestedValidTo } = req.body;
    
    if (!description || !requestedValidFrom || !requestedValidTo) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
    }
    
    // Parse date string từ frontend (format: YYYY-MM-DDTHH:mm:ss+07:00)
    // Frontend gửi: "2026-01-21T00:00:00+07:00" (00:00:00 VN time) và "2026-01-27T23:59:59+07:00" (23:59:59 VN time)
    // Cần parse và lưu đúng vào DB
    let fromDate, toDate;
    try {
      // Parse ISO string với timezone
      const fromDateObj = new Date(requestedValidFrom);
      const toDateObj = new Date(requestedValidTo);
      
      if (isNaN(fromDateObj.getTime()) || isNaN(toDateObj.getTime())) {
        return res.status(400).json({ success: false, message: 'Định dạng ngày không hợp lệ' });
      }
      
      // Lưu trực tiếp Date object, SQL Server sẽ lưu đúng giá trị
      fromDate = fromDateObj;
      toDate = toDateObj;
      
      if (fromDate >= toDate) {
        return res.status(400).json({ success: false, message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' });
      }
    } catch (error) {
      return res.status(400).json({ success: false, message: 'Định dạng ngày không hợp lệ' });
    }
    
    const pool = getPool();
    
    // Đảm bảo bảng ExtensionRequests tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExtensionRequests')
        BEGIN
          CREATE TABLE ExtensionRequests (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Description NVARCHAR(MAX) NOT NULL,
            RequestedValidFrom DATETIME NOT NULL,
            RequestedValidTo DATETIME NOT NULL,
            Status NVARCHAR(50) DEFAULT 'pending',
            AdminId INT NULL,
            AdminResponse NVARCHAR(MAX) NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE(),
            RejectedAt DATETIME NULL,
            ApprovedAt DATETIME NULL
          )
        END
        ELSE
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'RejectedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD RejectedAt DATETIME NULL
          END
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'ApprovedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD ApprovedAt DATETIME NULL
          END
        END
      `);
    } catch (tableError) {
      console.log('ExtensionRequests table creation skipped:', tableError.message);
    }
    
    // Kiểm tra user có tồn tại và là manager không
    const userCheck = await pool.request()
      .input('id', sql.Int, userId)
      .query(`
        SELECT u.Id, u.Username, u.FullName, u.Email, u.Status, u.ValidTo, r.Name AS Role 
        FROM Users u
        JOIN Roles r ON u.RoleId = r.Id
        WHERE u.Id = @id
      `);
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const user = userCheck.recordset[0];
    if (user.Role !== 'manager') {
      return res.status(400).json({ success: false, message: 'Chỉ Manager mới có thể gửi yêu cầu gia hạn' });
    }
    
    // Kiểm tra status: chỉ cho phép gửi yêu cầu nếu status = 'pending' (đã hết hạn) hoặc 'active' (nhưng đã hết hạn)
    // Không cho phép nếu status = 'inactive' (admin đã chuyển về ngừng hoạt động)
    if (user.Status === 'inactive') {
      return res.status(400).json({ success: false, message: 'Tài khoản của bạn đã bị ngừng hoạt động. Không thể gửi yêu cầu gia hạn.' });
    }
    
    // Kiểm tra xem có thực sự hết hạn không (nếu status = 'active')
    if (user.Status === 'active' && user.ValidTo) {
      const now = new Date();
      const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
      const validTo = new Date(user.ValidTo);
      
      // Nếu chưa hết hạn, không cho gửi yêu cầu
      if (validTo >= vietnamTime) {
        return res.status(400).json({ success: false, message: 'Tài khoản của bạn vẫn còn hiệu lực. Không cần gia hạn.' });
      }
    }
    
    // Tạo yêu cầu gia hạn - lưu CreatedAt đúng giờ VN (GMT+7)
    const result = await pool.request()
      .input('UserId', sql.Int, userId)
      .input('Description', sql.NVarChar, description)
      .input('RequestedValidFrom', sql.DateTime, fromDate)
      .input('RequestedValidTo', sql.DateTime, toDate)
      .query(`
        INSERT INTO ExtensionRequests (UserId, Description, RequestedValidFrom, RequestedValidTo, Status, CreatedAt)
        OUTPUT INSERTED.*
        VALUES (@UserId, @Description, @RequestedValidFrom, @RequestedValidTo, 'pending', DATEADD(HOUR, 7, GETUTCDATE()))
      `);
    
    const request = result.recordset[0];
    
    // Format RequestedValidFrom và RequestedValidTo để trả về đúng format như frontend gửi
    // Sử dụng giá trị gốc từ request body để tránh lệch timezone khi parse từ DB
    // Frontend đã gửi đúng format: YYYY-MM-DDTHH:mm:ss+07:00
    request.RequestedValidFrom = requestedValidFrom; // Giữ nguyên format từ frontend
    request.RequestedValidTo = requestedValidTo; // Giữ nguyên format từ frontend
    
    // Tạo notification cho tất cả admin
    try {
      // Đảm bảo bảng Notifications tồn tại
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
        BEGIN
          CREATE TABLE Notifications (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Message NVARCHAR(MAX) NOT NULL,
            Type NVARCHAR(50),
            RelatedUserId INT,
            ExtensionRequestId INT,
            IsRead BIT DEFAULT 0,
            CreatedAt DATETIME DEFAULT GETDATE()
          )
        END
        ELSE
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Notifications') AND name = 'ExtensionRequestId')
          BEGIN
            ALTER TABLE Notifications ADD ExtensionRequestId INT NULL
          END
        END
      `);
      
      const adminUsers = await pool.request()
        .query(`
          SELECT u.id 
          FROM Users u
          INNER JOIN Roles r ON u.RoleId = r.Id
          WHERE r.Name = 'admin' AND u.status = 'active'
        `);
      
      for (const admin of adminUsers.recordset) {
        try {
          await pool.request()
            .input('UserId', sql.Int, admin.id)
            .input('Message', sql.NVarChar, `Manager ${user.FullName} (${user.Username}) đã gửi yêu cầu gia hạn từ ${fromDate.toLocaleDateString('vi-VN')} đến ${toDate.toLocaleDateString('vi-VN')}`)
            .input('Type', sql.VarChar, 'extension_request')
            .input('RelatedUserId', sql.Int, userId)
            .input('ExtensionRequestId', sql.Int, request.Id)
            .input('IsRead', sql.Bit, 0)
            .query(`
              INSERT INTO Notifications (UserId, Message, Type, RelatedUserId, ExtensionRequestId, IsRead, CreatedAt)
              VALUES (@UserId, @Message, @Type, @RelatedUserId, @ExtensionRequestId, @IsRead, DATEADD(HOUR, 7, GETUTCDATE()))
            `);
        } catch (notifError) {
          console.error('Failed to create notification for admin:', admin.id, notifError.message);
        }
      }
    } catch (notifError) {
      console.error('Failed to create notifications:', notifError.message);
    }
    
    res.json({ 
      success: true, 
      message: 'Gửi yêu cầu gia hạn thành công',
      data: request
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /extension-requests:
 *   get:
 *     summary: Admin xem danh sách yêu cầu gia hạn
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu gia hạn
 */
router.get('/extension-requests', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const pool = getPool();
    
    // Đảm bảo bảng ExtensionRequests tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExtensionRequests')
        BEGIN
          CREATE TABLE ExtensionRequests (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Description NVARCHAR(MAX) NOT NULL,
            RequestedValidFrom DATETIME NOT NULL,
            RequestedValidTo DATETIME NOT NULL,
            Status NVARCHAR(50) DEFAULT 'pending',
            AdminId INT NULL,
            AdminResponse NVARCHAR(MAX) NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE(),
            RejectedAt DATETIME NULL,
            ApprovedAt DATETIME NULL
          )
        END
        ELSE
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'RejectedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD RejectedAt DATETIME NULL
          END
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'ApprovedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD ApprovedAt DATETIME NULL
          END
        END
      `);
    } catch (tableError) {
      // Table might already exist
    }
    
    // Đảm bảo các cột RejectedAt và ApprovedAt tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'RejectedAt')
        BEGIN
          ALTER TABLE ExtensionRequests ADD RejectedAt DATETIME NULL
        END
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'ApprovedAt')
        BEGIN
          ALTER TABLE ExtensionRequests ADD ApprovedAt DATETIME NULL
        END
      `);
    } catch (alterError) {
      // Columns might already exist
    }
    
    const result = await pool.request().query(`
      SELECT 
        er.Id,
        er.UserId,
        er.Description,
        er.RequestedValidFrom,
        er.RequestedValidTo,
        er.Status,
        er.AdminId,
        er.AdminResponse,
        er.CreatedAt,
        er.UpdatedAt,
        er.RejectedAt,
        er.ApprovedAt,
        u.Username,
        u.FullName,
        u.Email,
        u.Organization,
        u.Position,
        u.Phone,
        u.ValidFrom AS ApprovedValidFrom,
        u.ValidTo AS ApprovedValidTo
      FROM ExtensionRequests er
      INNER JOIN Users u ON er.UserId = u.Id
      ORDER BY er.CreatedAt DESC
    `);
    
    // Format dates để đảm bảo timezone VN đúng cho ValidFrom/ValidTo
    // Datetime fields (CreatedAt, UpdatedAt, etc.) trả về trực tiếp như các service khác, để frontend xử lý
    const formattedData = result.recordset.map(row => {
      const formatDateForVN = (dateValue, isEndDate = false) => {
        if (!dateValue) return null;
        // Parse date từ SQL Server
        // SQL Server lưu datetime không có timezone, khi Node.js parse, nó parse như local timezone của server
        // Nếu server ở UTC, datetime từ SQL Server sẽ được parse như UTC
        // Cần lấy đúng ngày theo timezone VN
        const date = new Date(dateValue);
        
        // Lấy các thành phần ngày tháng năm theo timezone VN
        // Sử dụng toLocaleString với timezone VN để đảm bảo lấy đúng ngày
        const vnDateStr = date.toLocaleString("en-US", { 
          timeZone: "Asia/Ho_Chi_Minh",
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        const [month, day, year] = vnDateStr.split('/');
        
        // Trả về ISO string với timezone VN (+07:00)
        // RequestedValidFrom/ApprovedValidFrom: 00:00:00, RequestedValidTo/ApprovedValidTo: 23:59:59
        const time = isEndDate ? '23:59:59' : '00:00:00';
        return `${year}-${month}-${day}T${time}+07:00`;
      };
      
      return {
        ...row,
        RequestedValidFrom: formatDateForVN(row.RequestedValidFrom, false),
        RequestedValidTo: formatDateForVN(row.RequestedValidTo, true),
        ApprovedValidFrom: formatDateForVN(row.ApprovedValidFrom, false),
        ApprovedValidTo: formatDateForVN(row.ApprovedValidTo, true)
        // CreatedAt, UpdatedAt, RejectedAt, ApprovedAt trả về trực tiếp như news service
      };
    });
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /extension-requests/{id}/approve:
 *   put:
 *     summary: Admin approve yêu cầu gia hạn
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminResponse:
 *                 type: string
 *               approvedValidFrom:
 *                 type: string
 *                 format: date-time
 *               approvedValidTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Approve thành công
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.put('/extension-requests/:id/approve', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse, approvedValidFrom, approvedValidTo } = req.body;
    const adminId = req.user.id;
    
    const pool = getPool();
    
    // Kiểm tra yêu cầu có tồn tại không
    const requestCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ExtensionRequests WHERE Id = @id');
    
    if (requestCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại' });
    }
    
    const request = requestCheck.recordset[0];
    
    if (request.Status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu đã được xử lý' });
    }
    
    // Admin phải chỉ định ngày approve (approvedValidFrom và approvedValidTo là bắt buộc)
    if (!approvedValidFrom || !approvedValidTo) {
      return res.status(400).json({ 
        success: false, 
        message: 'Vui lòng chỉ định ngày bắt đầu và ngày kết thúc khi phê duyệt' 
      });
    }
    
    // Lấy YYYY-MM-DD từ frontend (format: YYYY-MM-DD hoặc YYYY-MM-DDTHH:mm:ss+07:00)
    const fromDateStr = approvedValidFrom.split('T')[0]; // YYYY-MM-DD
    const toDateStr = approvedValidTo.split('T')[0];     // YYYY-MM-DD
    // Tạo chuỗi datetime cố định (không qua Date/UTC) để lưu đúng vào DB
    const validFromStr = `${fromDateStr} 00:00:00.000`;
    const validToStr = `${toDateStr} 23:59:59.000`;
    
    // Validate: ngày bắt đầu phải nhỏ hơn ngày kết thúc
    if (fromDateStr >= toDateStr) {
      return res.status(400).json({ 
        success: false, 
        message: 'Ngày bắt đầu phải nhỏ hơn ngày kết thúc' 
      });
    }
    
    // Đảm bảo cột ApprovedAt tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'ApprovedAt')
        BEGIN
          ALTER TABLE ExtensionRequests ADD ApprovedAt DATETIME NULL
        END
      `);
    } catch (alterError) {
      // Column might already exist
    }
    
    // Cập nhật yêu cầu với UpdatedAt và ApprovedAt
    // Dùng GETUTCDATE() + 7h để luôn lưu đúng giờ VN (GMT+7) bất kể timezone server
    await pool.request()
      .input('id', sql.Int, id)
      .input('adminId', sql.Int, adminId)
      .input('adminResponse', sql.NVarChar, adminResponse || 'Đã được phê duyệt')
      .input('status', sql.NVarChar, 'approved')
      .query(`
        UPDATE ExtensionRequests 
        SET Status = @status, AdminId = @adminId, AdminResponse = @adminResponse, 
            UpdatedAt = DATEADD(HOUR, 7, GETUTCDATE()), 
            ApprovedAt = DATEADD(HOUR, 7, GETUTCDATE())
        WHERE Id = @id
      `);
    
    // Cập nhật thời gian sử dụng cho user - truyền chuỗi YYYY-MM-DD HH:mm:ss để lưu đúng, tránh lệch timezone
    await pool.request()
      .input('userId', sql.Int, request.UserId)
      .input('validFrom', sql.VarChar, validFromStr)
      .input('validTo', sql.VarChar, validToStr)
      .input('status', sql.NVarChar, 'active')
      .query(`
        UPDATE Users 
        SET ValidFrom = CONVERT(DATETIME, @validFrom, 120), ValidTo = CONVERT(DATETIME, @validTo, 120), Status = @status
        WHERE Id = @userId
      `);
    
    // Format response để trả về đúng format VN timezone (+07:00) như frontend gửi
    // Sử dụng giá trị gốc từ request body để đảm bảo format nhất quán
    const formatResponseDate = (dateValue, isEndDate = false) => {
      // Parse date string từ frontend (format: YYYY-MM-DDTHH:mm:ss+07:00)
      const dateStr = dateValue.split('T')[0]; // Lấy phần YYYY-MM-DD
      const time = isEndDate ? '23:59:59' : '00:00:00';
      return `${dateStr}T${time}+07:00`;
    };
    
    res.json({ 
      success: true, 
      message: 'Phê duyệt yêu cầu gia hạn thành công',
      data: {
        validFrom: formatResponseDate(approvedValidFrom, false),
        validTo: formatResponseDate(approvedValidTo, true)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /extension-requests/{id}/reject:
 *   put:
 *     summary: Admin reject yêu cầu gia hạn
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminResponse:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reject thành công
 *       404:
 *         description: Không tìm thấy yêu cầu
 */
router.put('/extension-requests/:id/reject', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    const adminId = req.user.id;
    
    const pool = getPool();
    
    // Kiểm tra yêu cầu có tồn tại không
    const requestCheck = await pool.request()
      .input('id', sql.Int, id)
      .query('SELECT * FROM ExtensionRequests WHERE Id = @id');
    
    if (requestCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Yêu cầu không tồn tại' });
    }
    
    const request = requestCheck.recordset[0];
    
    if (request.Status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu đã được xử lý' });
    }
    
    // Đảm bảo cột RejectedAt tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'RejectedAt')
        BEGIN
          ALTER TABLE ExtensionRequests ADD RejectedAt DATETIME NULL
        END
      `);
    } catch (alterError) {
      // Column might already exist
    }
    
    // Cập nhật yêu cầu với UpdatedAt và RejectedAt
    // Dùng GETUTCDATE() + 7h để luôn lưu đúng giờ VN (GMT+7) bất kể timezone server
    await pool.request()
      .input('id', sql.Int, id)
      .input('adminId', sql.Int, adminId)
      .input('adminResponse', sql.NVarChar, adminResponse || 'Yêu cầu bị từ chối')
      .input('status', sql.NVarChar, 'rejected')
      .query(`
        UPDATE ExtensionRequests 
        SET Status = @status, AdminId = @adminId, AdminResponse = @adminResponse, 
            UpdatedAt = DATEADD(HOUR, 7, GETUTCDATE()), 
            RejectedAt = DATEADD(HOUR, 7, GETUTCDATE())
        WHERE Id = @id
      `);
    
    res.json({ 
      success: true, 
      message: 'Từ chối yêu cầu gia hạn thành công'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /extension-requests/my-requests:
 *   get:
 *     summary: Manager xem lịch sử yêu cầu gia hạn của mình
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách yêu cầu gia hạn của manager
 */
router.get('/extension-requests/my-requests', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const pool = getPool();
    
    // Đảm bảo bảng ExtensionRequests tồn tại
    try {
      await pool.request().query(`
        IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ExtensionRequests')
        BEGIN
          CREATE TABLE ExtensionRequests (
            Id INT IDENTITY(1,1) PRIMARY KEY,
            UserId INT NOT NULL,
            Description NVARCHAR(MAX) NOT NULL,
            RequestedValidFrom DATETIME NOT NULL,
            RequestedValidTo DATETIME NOT NULL,
            Status NVARCHAR(50) DEFAULT 'pending',
            AdminId INT NULL,
            AdminResponse NVARCHAR(MAX) NULL,
            CreatedAt DATETIME DEFAULT GETDATE(),
            UpdatedAt DATETIME DEFAULT GETDATE(),
            RejectedAt DATETIME NULL,
            ApprovedAt DATETIME NULL
          )
        END
        ELSE
        BEGIN
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'RejectedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD RejectedAt DATETIME NULL
          END
          IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('ExtensionRequests') AND name = 'ApprovedAt')
          BEGIN
            ALTER TABLE ExtensionRequests ADD ApprovedAt DATETIME NULL
          END
        END
      `);
    } catch (tableError) {
      // Table might already exist
    }
    
    // Kiểm tra user có phải là manager không
    const userCheck = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT u.Id, r.Name AS Role 
        FROM Users u
        JOIN Roles r ON u.RoleId = r.Id
        WHERE u.Id = @userId
      `);
    
    if (userCheck.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (userCheck.recordset[0].Role !== 'manager') {
      return res.status(403).json({ success: false, message: 'Chỉ Manager mới có thể xem lịch sử yêu cầu gia hạn' });
    }
    
    const result = await pool.request()
      .input('userId', sql.Int, userId)
      .query(`
        SELECT 
          er.Id,
          er.Description,
          er.RequestedValidFrom,
          er.RequestedValidTo,
          er.Status,
          er.AdminResponse,
          er.CreatedAt,
          er.UpdatedAt,
          er.RejectedAt,
          er.ApprovedAt,
          admin.FullName AS AdminFullName,
          admin.Username AS AdminUsername,
          u.ValidFrom AS ApprovedValidFrom,
          u.ValidTo AS ApprovedValidTo
        FROM ExtensionRequests er
        LEFT JOIN Users admin ON er.AdminId = admin.Id
        LEFT JOIN Users u ON er.UserId = u.Id
        WHERE er.UserId = @userId
        ORDER BY er.CreatedAt DESC
      `);
    
    // Format dates để đảm bảo timezone VN đúng cho ValidFrom/ValidTo
    // Datetime fields (CreatedAt, UpdatedAt, etc.) trả về trực tiếp như các service khác, để frontend xử lý
    const formatDateForVN = (dateValue, isEndDate = false) => {
      if (!dateValue) return null;
      // Parse date từ SQL Server
      // SQL Server trả về datetime không có timezone, Node.js parse như UTC
      // Cần convert đúng để lấy ngày theo timezone VN
      const date = new Date(dateValue);
      
      // Lấy các thành phần ngày tháng năm theo timezone VN
      const vnDateStr = date.toLocaleString("en-US", { 
        timeZone: "Asia/Ho_Chi_Minh",
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
      const [month, day, year] = vnDateStr.split('/');
      
      // Trả về ISO string với timezone VN (+07:00)
      // RequestedValidFrom/ApprovedValidFrom: 00:00:00, RequestedValidTo/ApprovedValidTo: 23:59:59
      const time = isEndDate ? '23:59:59' : '00:00:00';
      return `${year}-${month}-${day}T${time}+07:00`;
    };
    
    const formattedData = result.recordset.map(row => ({
      ...row,
      RequestedValidFrom: formatDateForVN(row.RequestedValidFrom, false),
      RequestedValidTo: formatDateForVN(row.RequestedValidTo, true),
      ApprovedValidFrom: formatDateForVN(row.ApprovedValidFrom, false),
      ApprovedValidTo: formatDateForVN(row.ApprovedValidTo, true)
      // CreatedAt, UpdatedAt, RejectedAt, ApprovedAt trả về trực tiếp như news service
    }));
    
    res.json({ success: true, data: formattedData });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router; 