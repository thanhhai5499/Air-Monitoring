const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load environment variables with fallback
let JWT_SECRET = 'Qw8!zT2@kL4#pR6^wY1*eF5%uJ3$hN9&bS7'; // Default fallback

try {
    // Try to load from config.env file first
    const envPath = path.join(__dirname, '../../config.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        const envVars = {};
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !key.startsWith('#')) {
                envVars[key.trim()] = value.trim();
            }
        });
        if (envVars.JWT_SECRET) {
            JWT_SECRET = envVars.JWT_SECRET;
        }
    }
} catch (error) {}

// Use process.env as fallback (for Docker deployment)
if (process.env.JWT_SECRET) {
    JWT_SECRET = process.env.JWT_SECRET;
}

const authenticateToken = (req, res, next) => {
    console.log('Headers received:', req.headers); // Log toàn bộ headers để kiểm tra
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    console.log('Token received:', token);
    if (!token) {
        console.log('No token provided');
        return res.status(401).json({ success: false, message: 'Access token required' });
    }
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        console.log('Decoded user:', decoded);
        req.user = decoded;
        next();
    } catch (error) {
        console.log('JWT verify error:', error);
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: 'Token expired' });
        }
        return res.status(401).json({ success: false, message: 'Invalid token' });
    }
};

const authorizeAdmin = (req, res, next) => {
    if (!req.user || !(req.user.role === 'admin' || req.user.role === 1 || req.user.role === '1')) {
        return res.status(403).json({ success: false, message: 'Forbidden: Admins only' });
    }
    next();
};

module.exports = {
    authenticateToken,
    authorizeAdmin
}; 