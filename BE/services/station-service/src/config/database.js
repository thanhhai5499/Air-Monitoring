const sql = require('mssql');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '../../config.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
        envVars[key.trim()] = value.trim();
    }
});

// SQL Server configuration
const dbConfig = {
    server: envVars.DB_SERVER || '27.71.25.65',
    port: parseInt(envVars.DB_PORT) || 1433,
    database: envVars.DB_NAME || 'AirMonitoring',
    user: envVars.DB_USER || 'sa',
    password: envVars.DB_PASSWORD || 'itDYMB0RZrLyXka',
    options: {
        encrypt: false, // For Azure use true
        trustServerCertificate: true, // For local dev / self-signed certs
        enableArithAbort: true,
        requestTimeout: 30000,
        connectionTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

// Create connection pool
let pool;

const connectDB = async () => {
    try {
        if (pool) {
            return pool;
        }
        pool = await sql.connect(dbConfig);
        console.log('✅ Connected to SQL Server successfully');
        // Test the connection
        const result = await pool.request().query('SELECT 1 as test');
        console.log('✅ Database query test successful:', result.recordset[0]);
        return pool;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        throw error;
    }
};

const getPool = () => {
    if (!pool) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return pool;
};

const closeDB = async () => {
    try {
        if (pool) {
            await pool.close();
            console.log('✅ Database connection closed');
        }
    } catch (error) {
        console.error('❌ Error closing database connection:', error.message);
    }
};

module.exports = {
    connectDB,
    getPool,
    closeDB,
    sql
}; 