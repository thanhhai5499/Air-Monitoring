const { getPool, sql } = require('../config/database');

class SensorTypeCache {
  constructor() {
    this.cache = new Map();
    this.lastUpdate = 0;
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async getSensorTypes() {
    const now = Date.now();
    
    // Return cached data if still valid
    if (this.cache.size > 0 && (now - this.lastUpdate) < this.cacheTimeout) {
      return this.cache;
    }

    // Refresh cache
    try {
      const pool = getPool();
      const result = await pool.request().query('SELECT Id, Name FROM SensorTypes');
      
      this.cache.clear();
      result.recordset.forEach(row => {
        this.cache.set(row.Name.toLowerCase(), row.Id);
      });
      
      this.lastUpdate = now;
      
      return this.cache;
    } catch (error) {
      // Return existing cache if available, otherwise throw
      if (this.cache.size > 0) {
        return this.cache;
      }
      throw error;
    }
  }

  clearCache() {
    this.cache.clear();
    this.lastUpdate = 0;
  }

  getCacheSize() {
    return this.cache.size;
  }

  isCacheValid() {
    return this.cache.size > 0 && (Date.now() - this.lastUpdate) < this.cacheTimeout;
  }
}

// Singleton instance
const sensorTypeCache = new SensorTypeCache();

module.exports = {
  sensorTypeCache
}; 