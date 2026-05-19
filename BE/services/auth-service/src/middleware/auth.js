const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load environment variables: prefer config.env (local dev), fall back to process.env (Docker env_file)
const envPath = path.join(__dirname, '../../config.env');
const envVars = {};
try {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value && !key.startsWith('#')) {
            envVars[key.trim()] = value.trim();
        }
    });
} catch (_) {
    // config.env not present — running in Docker; rely on process.env injected by env_file
}

const JWT_SECRET = envVars.JWT_SECRET || process.env.JWT_SECRET || 'Qw8!zT2@kL4#pR6^wY1*eF5%uJ3$hN9&bS7';

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Access token required'
        });
    }

    try {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (err) {
                if (err.name === 'TokenExpiredError') {
                    return res.status(401).json({ success: false, message: 'Token expired' });
                }
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }
            req.user = decoded;
            next();
        });
    } catch (error) {
        return res.status(403).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
};

const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

module.exports = {
    authenticateToken,
    authorizeRoles
}; 