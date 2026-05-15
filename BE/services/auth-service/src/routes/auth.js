const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { getPool, sql } = require('../config/database');
const path = require('path');
const fs = require('fs');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const router = express.Router();

// Sử dụng biến môi trường chuẩn
const JWT_SECRET = process.env.JWT_SECRET || 'Qw8!zT2@kL4#pR6^wY1*eF5%uJ3$hN9&bS7';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN;

// Validation middleware
const validateRegistration = [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('fullName').notEmpty().withMessage('Full name is required'),
    body('role').isIn(['admin', 'manager', 'user']).withMessage('Invalid role'),
    body('organization').optional().isLength({ min: 3 }).withMessage('Organization must be at least 3 characters'),
    body('position').optional().isLength({ min: 3 }).withMessage('Position must be at least 3 characters'),
    body('phone').optional().isLength({ min: 10 }).withMessage('Phone must be at least 10 characters')
];

const validateLogin = [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
];

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Đăng ký tài khoản mới
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, manager, user]
 *               organization:
 *                 type: string
 *               position:
 *                 type: string
 *               phone:
 *                 type: string
 *           example:
 *             username: "string"
 *             email: "string"
 *             password: "string"
 *             fullName: "string"
 *             role: "manager"
 *             organization: "string"
 *             position: "string"
 *             phone: "string"
 *     responses:
 *       201:
 *         description: Đăng ký thành công
 *       400:
 *         description: Lỗi xác thực hoặc tài khoản đã tồn tại
 */
// Register new user
router.post('/register', validateRegistration, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { username, email, password, fullName, role = 'manager', organization, position, phone } = req.body;
        const pool = getPool();

        // Check if user already exists
        const existingUser = await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .query(`
                SELECT id FROM Users 
                WHERE username = @username OR email = @email
            `);

        if (existingUser.recordset.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Username or email already exists'
            });
        }

        // Lấy role, nếu không có thì mặc định là 'manager' (RoleId = 2)
        let userRole = role;
        if (!userRole || typeof userRole !== 'string' || userRole.trim() === '') {
            userRole = 'manager';
        }
        // Lấy RoleId từ Roles
        const roleResult = await pool.request()
            .input('roleName', sql.VarChar, userRole)
            .query('SELECT Id FROM Roles WHERE Name = @roleName');
        if (roleResult.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Role not found' });
        }
        const roleId = roleResult.recordset[0].Id;

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Xác định status: nếu là manager thì set "pending", các role khác thì "active"
        const userStatus = (userRole === 'manager') ? 'pending' : 'active';

        // Insert new user
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hashedPassword)
            .input('fullName', sql.NVarChar, fullName)
            .input('roleId', sql.Int, roleId)
            .input('organization', sql.NVarChar, organization || null)
            .input('position', sql.NVarChar, position || null)
            .input('phone', sql.NVarChar, phone || null)
            .input('status', sql.VarChar, userStatus)
            .input('createdAt', sql.DateTime, new Date())
            .query(`
                INSERT INTO Users (username, email, password, fullName, RoleId, Organization, Position, Phone, status, createdAt)
                OUTPUT INSERTED.id, INSERTED.username, INSERTED.email, INSERTED.fullName, INSERTED.RoleId, INSERTED.Organization, INSERTED.Position, INSERTED.Phone, INSERTED.status
                VALUES (@username, @email, @password, @fullName, @roleId, @organization, @position, @phone, @status, @createdAt)
            `);

        const newUser = result.recordset[0];

        // Lấy tên vai trò trả về
        const roleNameResult = await pool.request()
            .input('roleId', sql.Int, newUser.RoleId)
            .query('SELECT Name FROM Roles WHERE Id = @roleId');
        const roleName = roleNameResult.recordset[0]?.Name || '';

        // Nếu là manager và status = pending, tạo notification cho admin và không tạo token
        if (userRole === 'manager' && userStatus === 'pending') {
            // Đảm bảo bảng Notifications tồn tại
            try {
                await pool.request().query(`
                    IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Notifications')
                    BEGIN
                        CREATE TABLE Notifications (
                            Id INT IDENTITY(1,1) PRIMARY KEY,
                            UserId INT NOT NULL,
                            Message NVARCHAR(MAX) NOT NULL,
                            Type NVARCHAR(50),
                            RelatedUserId INT,
                            IsRead BIT DEFAULT 0,
                            CreatedAt DATETIME DEFAULT GETDATE()
                        )
                    END
                `);
            } catch (tableError) {
                console.log('Notification table creation skipped (might already exist):', tableError.message);
            }

            // Lấy danh sách admin để gửi notification
            try {
                const adminUsers = await pool.request()
                    .query(`
                        SELECT u.id 
                        FROM Users u
                        INNER JOIN Roles r ON u.RoleId = r.Id
                        WHERE r.Name = 'admin' AND u.status = 'active'
                    `);

                // Tạo notification cho từng admin
                for (const admin of adminUsers.recordset) {
                    try {
                        await pool.request()
                            .input('UserId', sql.Int, admin.id)
                            .input('Message', sql.NVarChar, `Người dùng ${fullName} (${username}) đã đăng ký tài khoản Manager và đang chờ phê duyệt`)
                            .input('Type', sql.VarChar, 'manager_approval_request')
                            .input('RelatedUserId', sql.Int, newUser.id)
                            .input('IsRead', sql.Bit, 0)
                            .input('CreatedAt', sql.DateTime, new Date())
                            .query(`
                                INSERT INTO Notifications (UserId, Message, Type, RelatedUserId, IsRead, CreatedAt)
                                VALUES (@UserId, @Message, @Type, @RelatedUserId, @IsRead, @CreatedAt)
                            `);
                    } catch (notifError) {
                        console.error('Failed to create notification for admin:', admin.id, notifError.message);
                    }
                }
            } catch (adminError) {
                console.error('Failed to get admin users for notification:', adminError.message);
            }

            // Trả về response không có token
            return res.status(201).json({
                success: true,
                message: 'Đăng ký thành công. Tài khoản của bạn đang chờ phê duyệt từ Admin.',
                data: {
                    user: {
                        id: newUser.id,
                        username: newUser.username,
                        email: newUser.email,
                        fullName: newUser.fullName,
                        role: roleName,
                        status: newUser.status,
                        organization: newUser.Organization,
                        position: newUser.Position,
                        phone: newUser.Phone
                    }
                }
            });
        }

        // Nếu không phải manager hoặc đã active, tạo token như bình thường
        const token = jwt.sign(
            {
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: roleName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: newUser.id,
                    username: newUser.username,
                    email: newUser.email,
                    fullName: newUser.fullName,
                    role: roleName,
                    organization: newUser.Organization,
                    position: newUser.Position,
                    phone: newUser.Phone
                },
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Đăng nhập
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       401:
 *         description: Sai thông tin đăng nhập hoặc tài khoản bị khóa
 */
// Login user
router.post('/login', validateLogin, async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation errors',
                errors: errors.array()
            });
        }

        const { username, password } = req.body;
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
            // Columns might already exist
        }

        // Find user by username or email, join với Roles để lấy tên vai trò
        const user = await pool.request()
            .input('username', sql.VarChar, username)
            .query(`
                SELECT u.id, u.username, u.email, u.password, u.fullName, u.status, u.Organization, u.Position, u.Phone, u.lastLoginAt, u.ValidFrom, u.ValidTo, r.Name as roleName
                FROM Users u
                LEFT JOIN Roles r ON u.RoleId = r.Id
                WHERE u.username = @username OR u.email = @username
            `);

        if (user.recordset.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        const userData = user.recordset[0];

        // Verify password FIRST - Security: Don't leak user status/expiration info if password is wrong
        const isValidPassword = await bcrypt.compare(password, userData.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản hoặc Mật khẩu không đúng'
            });
        }

        // Only check status and expiration AFTER password is verified
        // Kiểm tra thời gian sử dụng và status
        let isExpired = false;
        const now = new Date();
        const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
        
        // Kiểm tra ValidFrom trước (nếu có)
        if (userData.ValidFrom) {
            // Parse ValidFrom và format theo timezone VN để tránh lệch ngày
            const validFromDate = new Date(userData.ValidFrom);
            // Format date theo timezone VN để hiển thị đúng
            const validFromVN = new Date(validFromDate.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
            const validFromDateOnly = new Date(validFromVN.getFullYear(), validFromVN.getMonth(), validFromVN.getDate());
            const vietnamTimeDateOnly = new Date(vietnamTime.getFullYear(), vietnamTime.getMonth(), vietnamTime.getDate());
            
            if (validFromDateOnly > vietnamTimeDateOnly) {
                // Format date để hiển thị đúng ngày theo VN
                const displayDate = validFromVN.toLocaleDateString('vi-VN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                });
                return res.status(401).json({
                    success: false,
                    message: `Tài khoản của bạn sẽ có hiệu lực từ ${displayDate}. Vui lòng đợi đến ngày đó để đăng nhập.`
                });
            }
        }
        
        // Kiểm tra ValidTo (nếu có)
        if (userData.ValidTo) {
            const validTo = new Date(userData.ValidTo);
            
            // Nếu ValidTo < now thì account đã hết hạn
            if (validTo < vietnamTime) {
                // Nếu là manager, vẫn cho phép đăng nhập để gửi yêu cầu gia hạn
                // Nhưng đánh dấu là expired để frontend redirect đến extension-request
                if (userData.roleName === 'manager') {
                    isExpired = true;
                } else {
                    // Nếu không phải manager, không cho phép đăng nhập
                    return res.status(401).json({
                        success: false,
                        message: 'Tài khoản của bạn đã hết hạn sử dụng. Vui lòng liên hệ Admin để gia hạn.'
                    });
                }
            }
        }
        
        // Kiểm tra status
        // Nếu status = 'pending' và là manager:
        // - Có ValidTo đã hết hạn: cho phép đăng nhập (isExpired = true) để gửi yêu cầu gia hạn
        // - Không có ValidTo (mới đăng ký): cho phép đăng nhập (isNewPending = true) để gửi yêu cầu mở khóa
        let isNewPending = false;
        if (userData.status === 'pending') {
            if (isExpired) {
                // Đã hết hạn -> cho phép đăng nhập để gửi yêu cầu gia hạn
            } else if (!userData.ValidTo) {
                // Mới đăng ký, chưa có ValidTo -> cho phép đăng nhập để gửi yêu cầu mở khóa
                isNewPending = true;
            } else {
                // Pending nhưng có ValidTo chưa hết hạn (trường hợp hiếm) -> không cho đăng nhập
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản của bạn đang chờ phê duyệt từ Admin. Vui lòng đợi phê duyệt để đăng nhập.'
                });
            }
        }
        
        // Check if user is inactive (không phải pending)
        if (userData.status === 'inactive') {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản đã bị khóa vui lòng đăng kí tài khoản khác để sử dụng'
            });
        }
        
        // Nếu status không phải 'active' hoặc 'pending' (đã hết hạn), không cho đăng nhập
        if (userData.status !== 'active' && !isExpired) {
            return res.status(401).json({
                success: false,
                message: 'Tài khoản không hợp lệ'
            });
        }

        // Lấy giờ Việt Nam
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);

        // Update lastLoginAt
        await pool.request()
            .input('userId', sql.Int, userData.id)
            .input('lastLoginAt', sql.DateTime, nowVN)
            .query(`
                UPDATE Users SET lastLoginAt = @lastLoginAt WHERE id = @userId
            `);
        // Ghi vào LoginHistory
        await pool.request()
            .input('userId', sql.Int, userData.id)
            .input('loginTime', sql.DateTime, nowVN)
            .input('loginMethod', sql.NVarChar, 'local')
            .input('ipAddress', sql.NVarChar, req.ip || null)
            .query('INSERT INTO LoginHistory (UserId, LoginTime, LoginMethod, IpAddress) VALUES (@userId, @loginTime, @loginMethod, @ipAddress)');

        // Generate JWT token
        const token = jwt.sign(
            {
                id: userData.id,
                username: userData.username,
                email: userData.email,
                role: userData.roleName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        // Nếu account hết hạn hoặc mới đăng ký (pending), trả về flag để frontend redirect đến trang yêu cầu gia hạn
        const responseData = {
            success: true,
            message: isExpired ? 'Tài khoản của bạn đã hết hạn sử dụng. Vui lòng gửi yêu cầu gia hạn.' : (isNewPending ? 'Tài khoản của bạn đang chờ mở khóa. Vui lòng gửi yêu cầu gia hạn để Admin phê duyệt.' : 'Login successful'),
            data: {
                user: {
                    id: userData.id,
                    username: userData.username,
                    email: userData.email,
                    fullName: userData.fullName,
                    role: userData.roleName,
                    organization: userData.Organization,
                    position: userData.Position,
                    phone: userData.Phone,
                    lastLoginAt: nowVN,
                    status: userData.status,
                    ValidFrom: userData.ValidFrom,
                    ValidTo: userData.ValidTo
                },
                token
            }
        };
        
        // Thêm flag expired hoặc isNewPending để frontend redirect đến trang yêu cầu gia hạn
        if (isExpired || isNewPending) {
            responseData.expired = true; // Dùng chung flag để redirect
            responseData.isNewPending = isNewPending;
            responseData.userId = userData.id;
        }
        
        res.json(responseData);

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            error: error.message
        });
    }
});

/**
 * @swagger
 * /auth/google-oauth:
 *   post:
 *     summary: Đăng nhập Google OAuth thực tế
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Đăng nhập thành công
 *       201:
 *         description: Đăng ký và đăng nhập thành công
 *       400:
 *         description: Lỗi xác thực
 */
router.post('/google-oauth', async (req, res) => {
    try {
        const { idToken } = req.body;
        if (!idToken) {
            return res.status(400).json({ success: false, message: 'Missing idToken' });
        }
        // Xác thực idToken với Google
        const googleApi = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
        const googleRes = await fetch(googleApi);
        if (!googleRes.ok) {
            return res.status(400).json({ success: false, message: 'Invalid Google token' });
        }
        const profile = await googleRes.json();
        const email = profile.email;
        const fullName = profile.name;
        const googleId = profile.sub;
        const avatar = profile.picture;
        if (!email || !googleId) {
            return res.status(400).json({ success: false, message: 'Google profile missing email or id' });
        }
        const pool = getPool();
        // Kiểm tra user đã tồn tại chưa
        const userResult = await pool.request()
            .input('email', sql.VarChar, email)
            .input('googleId', sql.VarChar, googleId)
            .query('SELECT u.*, r.Name as roleName FROM Users u LEFT JOIN Roles r ON u.RoleId = r.Id WHERE u.Email = @email OR u.GoogleId = @googleId');
        let user = userResult.recordset[0];
        let isNew = false;
        if (!user) {
            // Luôn gán RoleId = 3 cho user Google
            const roleId = 3;
            // Sinh username duy nhất cho user Google
            const username = `gg_${googleId}`;
            // Tạo user mới, chỉ OUTPUT các trường của Users
            const insertResult = await pool.request()
                .input('username', sql.VarChar, username)
                .input('email', sql.VarChar, email)
                .input('fullName', sql.NVarChar, fullName)
                .input('googleId', sql.VarChar, googleId)
                .input('avatar', sql.VarChar, avatar || null)
                .input('roleId', sql.Int, roleId)
                .input('status', sql.VarChar, 'active')
                .input('createdAt', sql.DateTime, new Date(Date.now() + 7 * 60 * 60 * 1000))
                .query('INSERT INTO Users (Username, Email, FullName, GoogleId, Avatar, RoleId, Status, CreatedAt) OUTPUT INSERTED.* VALUES (@username, @email, @fullName, @googleId, @avatar, @roleId, @status, @createdAt)');
            user = insertResult.recordset[0];
            isNew = true;
            // Truy vấn lấy roleName
            const roleNameResult = await pool.request()
                .input('roleId', sql.Int, user.RoleId)
                .query('SELECT Name FROM Roles WHERE Id = @roleId');
            user.roleName = roleNameResult.recordset[0]?.Name || '';
        } else {
            // Nếu user đã tồn tại nhưng status khác 'active', không cho đăng nhập
            if (user.Status && user.Status.toLowerCase() !== 'active') {
                return res.status(401).json({
                    success: false,
                    message: 'Tài khoản đã bị khóa vui lòng đăng kí tài khoản khác để sử dụng'
                });
            }
        }
        // Lấy giờ Việt Nam
        const nowVN = new Date(Date.now() + 7 * 60 * 60 * 1000);
        // Cập nhật lastLoginAt cho user Google
        await pool.request()
            .input('userId', sql.Int, user.Id)
            .input('lastLoginAt', sql.DateTime, nowVN)
            .query('UPDATE Users SET lastLoginAt = @lastLoginAt WHERE Id = @userId');
        // Ghi vào LoginHistory
        await pool.request()
            .input('userId', sql.Int, user.Id)
            .input('loginTime', sql.DateTime, nowVN)
            .input('loginMethod', sql.NVarChar, 'google')
            .input('ipAddress', sql.NVarChar, req.ip || null)
            .query('INSERT INTO LoginHistory (UserId, LoginTime, LoginMethod, IpAddress) VALUES (@userId, @loginTime, @loginMethod, @ipAddress)');
        // Generate JWT token
        const token = jwt.sign(
            {
                id: user.Id,
                username: user.Username,
                email: user.Email,
                role: user.roleName
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );
        res.status(isNew ? 201 : 200).json({
            success: true,
            message: isNew ? 'User registered and logged in with Google' : 'Login with Google successful',
            data: {
                user: {
                    id: user.Id,
                    username: user.Username,
                    email: user.Email,
                    fullName: user.FullName,
                    role: user.roleName,
                    avatar: user.Avatar,
                    googleId: user.GoogleId,
                    organization: user.Organization,
                    position: user.Position,
                    phone: user.Phone,
                    lastLoginAt: nowVN
                },
                token
            }
        });
    } catch (error) {
        console.error('Google OAuth login error:', error);
        res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
});

module.exports = router; 