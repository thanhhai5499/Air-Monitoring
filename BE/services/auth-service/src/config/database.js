const sql = require('mssql');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../config.env') });

// SQL Server configuration
const dbConfig = {
    server: process.env.DB_SERVER,
    port: parseInt(process.env.DB_PORT, 10) || 1433,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
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
