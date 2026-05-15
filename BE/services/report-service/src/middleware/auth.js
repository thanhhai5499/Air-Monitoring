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
} catch (error) {

}

// Use process.env as fallback (for Docker deployment)
if (process.env.JWT_SECRET) {
    JWT_SECRET = process.env.JWT_SECRET;

}

// Log the JWT_SECRET for debugging (only first 10 characters)


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

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired'
            });
        }
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
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