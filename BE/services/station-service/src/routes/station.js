const express = require('express');
const { getPool, sql } = require('../config/database');
const router = express.Router();
const { authenticateToken, authorizeAdmin } = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: Station
 *     description: Quản lý trạm quan trắc
 */

/**
 * @swagger
 * /list:
 *   get:
 *     tags: [Station]
 *     summary: Lấy danh sách trạm
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách trạm
 */
// GET /stations/list - trả về danh sách trạm và tên trạm
router.get('/list', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request().query('SELECT Id, Name, Status, Location FROM Stations');
    res.json({ success: true, data: result.recordset });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /detailed-list:
 *   get:
 *     tags: [Station]
 *     summary: Lấy danh sách trạm chi tiết với thông tin sensors và dữ liệu cập nhật gần nhất
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách trạm chi tiết
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       location:
 *                         type: string
 *                       latitude:
 *                         type: number
 *                       longitude:
 *                         type: number
 *                       status:
 *                         type: string
 *                       description:
 *                         type: string
 *                       createdAt:
 *                         type: string
 *                       updatedAt:
 *                         type: string
 *                       sensors:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             sensorTypeId:
 *                               type: integer
 *                             sensorName:
 *                               type: string
 *                             unit:
 *                               type: string
 *                             lastReading:
 *                               type: object
 *                               properties:
 *                                 value:
 *                                   type: number
 *                                 recordedAt:
 *                                   type: string
 *       500:
 *         description: Internal server error
 */
// GET /stations/detailed-list - trả về danh sách trạm chi tiết với sensors và dữ liệu cập nhật gần nhất
router.get('/detailed-list', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    
    // Query để lấy thông tin trạm và sensors với dữ liệu cập nhật gần nhất
    const query = `
      WITH LatestReadings AS (
        SELECT 
          StationId,
          SensorTypeId,
          Value,
          RecordedAt,
          ROW_NUMBER() OVER (PARTITION BY StationId, SensorTypeId ORDER BY RecordedAt DESC) as rn
        FROM SensorReadings
      )
      SELECT 
        s.Id,
        s.Name,
        s.Location,
        s.Latitude,
        s.Longitude,
        s.Status,
        s.Description,
        s.CreatedAt,
        s.UpdatedAt,
        st.Id as SensorTypeId,
        st.Name as SensorName,
        st.Description as SensorDescription,
        st.Unit,
        lr.Value as LastValue,
        lr.RecordedAt as LastRecordedAt
      FROM Stations s
      LEFT JOIN StationSensors ss ON s.Id = ss.StationId
      LEFT JOIN SensorTypes st ON ss.SensorTypeId = st.Id
      LEFT JOIN LatestReadings lr ON s.Id = lr.StationId AND st.Id = lr.SensorTypeId AND lr.rn = 1
      ORDER BY s.Id, st.Id
    `;
    
    const result = await pool.request().query(query);
    
    // Xử lý dữ liệu để nhóm theo trạm
    const stationsMap = new Map();
    
    result.recordset.forEach(row => {
      const stationId = row.Id;
      
      if (!stationsMap.has(stationId)) {
        // Tạo object trạm mới
        stationsMap.set(stationId, {
          id: row.Id,
          name: row.Name,
          location: row.Location,
          latitude: row.Latitude,
          longitude: row.Longitude,
          status: row.Status,
          description: row.Description,
          createdAt: row.CreatedAt,
          updatedAt: row.UpdatedAt,
          sensors: []
        });
      }
      
      const station = stationsMap.get(stationId);
      
      // Thêm sensor nếu có
      if (row.SensorTypeId) {
        const sensor = {
          sensorTypeId: row.SensorTypeId,
          sensorName: row.SensorName,
          sensorDescription: row.SensorDescription,
          unit: row.Unit,
          lastReading: row.LastValue !== null ? {
            value: row.LastValue,
            recordedAt: row.LastRecordedAt
          } : null
        };
        
        station.sensors.push(sensor);
      }
    });
    
    // Chuyển Map thành Array
    const stations = Array.from(stationsMap.values());
    
    res.json({ 
      success: true, 
      data: stations,
      total: stations.length
    });
    
  } catch (error) {
    console.error('Error fetching detailed stations list:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /stations/{id}:
 *   get:
 *     tags: [Station]
 *     summary: Lấy thông tin chi tiết của một trạm cụ thể
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID của trạm
 *     responses:
 *       200:
 *         description: Thông tin chi tiết trạm
 *       404:
 *         description: Trạm không tồn tại
 *       500:
 *         description: Internal server error
 */
// GET /stations/:id - lấy thông tin chi tiết của một trạm
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const pool = await getPool();
    
    // Query để lấy thông tin trạm và sensors với dữ liệu cập nhật gần nhất
    const query = `
      WITH LatestReadings AS (
        SELECT 
          StationId,
          SensorTypeId,
          Value,
          RecordedAt,
          ROW_NUMBER() OVER (PARTITION BY StationId, SensorTypeId ORDER BY RecordedAt DESC) as rn
        FROM SensorReadings
        WHERE StationId = @stationId
      )
      SELECT 
        s.Id,
        s.Name,
        s.Location,
        s.Latitude,
        s.Longitude,
        s.Status,
        s.Description,
        s.CreatedAt,
        s.UpdatedAt,
        st.Id as SensorTypeId,
        st.Name as SensorName,
        st.Description as SensorDescription,
        st.Unit,
        lr.Value as LastValue,
        lr.RecordedAt as LastRecordedAt
      FROM Stations s
      LEFT JOIN StationSensors ss ON s.Id = ss.StationId
      LEFT JOIN SensorTypes st ON ss.SensorTypeId = st.Id
      LEFT JOIN LatestReadings lr ON s.Id = lr.StationId AND st.Id = lr.SensorTypeId AND lr.rn = 1
      WHERE s.Id = @stationId
      ORDER BY st.Id
    `;
    
    const result = await pool.request()
      .input('stationId', sql.Int, id)
      .query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Trạm không tồn tại' 
      });
    }
    
    // Xử lý dữ liệu
    const stationData = {
      id: result.recordset[0].Id,
      name: result.recordset[0].Name,
      location: result.recordset[0].Location,
      latitude: result.recordset[0].Latitude,
      longitude: result.recordset[0].Longitude,
      status: result.recordset[0].Status,
      description: result.recordset[0].Description,
      createdAt: result.recordset[0].CreatedAt,
      updatedAt: result.recordset[0].UpdatedAt,
      sensors: []
    };
    
    // Thêm sensors
    result.recordset.forEach(row => {
      if (row.SensorTypeId) {
        const sensor = {
          sensorTypeId: row.SensorTypeId,
          sensorName: row.SensorName,
          sensorDescription: row.SensorDescription,
          unit: row.Unit,
          lastReading: row.LastValue !== null ? {
            value: row.LastValue,
            recordedAt: row.LastRecordedAt
          } : null
        };
        
        stationData.sensors.push(sensor);
      }
    });
    
    res.json({ 
      success: true, 
      data: stationData
    });
    
  } catch (error) {
    console.error('Error fetching station details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Internal server error', 
      error: error.message 
    });
  }
});

/**
 * @swagger
 * /stations:
 *   post:
 *     tags: [Station]
 *     summary: Thêm mới trạm (chỉ admin)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               location: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               status: { type: string }
 *     responses:
 *       201:
 *         description: Thêm thành công
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
router.post('/', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log('[Station] POST /stations - Request body:', req.body);
    console.log('[Station] POST /stations - User:', req.user);
    
    const { name, location, description, latitude, longitude, status, sensorTypeIds } = req.body;
    
    // Validation
    if (!name || !location) {
      console.log('[Station] POST /stations - Missing required fields');
      return res.status(400).json({ success: false, message: 'Missing required fields: name and location are required' });
    }
    
    if (latitude === undefined || longitude === undefined) {
      console.log('[Station] POST /stations - Missing coordinates');
      return res.status(400).json({ success: false, message: 'Missing required fields: latitude and longitude are required' });
    }
    
    const pool = await getPool();
    
    // Thêm trạm
    console.log('[Station] POST /stations - Inserting station with data:', { name, location, description, latitude, longitude, status: status || 'active' });
    
    const result = await pool.request()
      .input('Name', sql.NVarChar, name)
      .input('Location', sql.NVarChar, location)
      .input('Description', sql.NVarChar, description || null)
      .input('Latitude', sql.Decimal(10, 6), latitude)
      .input('Longitude', sql.Decimal(10, 6), longitude)
      .input('Status', sql.NVarChar, status || 'active')
      .query(`INSERT INTO Stations (Name, Location, Description, Latitude, Longitude, Status) OUTPUT INSERTED.* VALUES (@Name, @Location, @Description, @Latitude, @Longitude, @Status)`);
    
    const station = result.recordset[0];
    console.log('[Station] POST /stations - Station created:', station);
    
    // Lấy sensorTypeId của Battery
    const batterySensor = await pool.request().query(`SELECT Id FROM SensorTypes WHERE LOWER(Name) = 'battery'`);
    const batteryId = batterySensor.recordset[0]?.Id;
    console.log('[Station] POST /stations - Battery sensor ID:', batteryId);
    
    // Insert các sensorTypeId được chọn + Battery
    const allSensorIds = Array.from(new Set([...(sensorTypeIds || []), batteryId].filter(Boolean)));
    console.log('[Station] POST /stations - All sensor IDs to insert:', allSensorIds);
    
    for (const sensorTypeId of allSensorIds) {
      await pool.request()
        .input('StationId', sql.Int, station.Id)
        .input('SensorTypeId', sql.Int, sensorTypeId)
        .query('INSERT INTO StationSensors (StationId, SensorTypeId) VALUES (@StationId, @SensorTypeId)');
    }
    
    console.log('[Station] POST /stations - Success, returning station data');
    res.status(201).json({ success: true, data: station });
    
  } catch (error) {
    console.error('[Station] POST /stations - Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

/**
 * @swagger
 * /stations/{id}:
 *   put:
 *     tags: [Station]
 *     summary: Cập nhật trạm (chỉ admin)
 *     security:
 *       - bearerAuth: []
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
 *               name: { type: string }
 *               location: { type: string }
 *               latitude: { type: number }
 *               longitude: { type: number }
 *               status: { type: string }
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 *       500:
 *         description: Internal server error
 */
router.put('/:id', authenticateToken, authorizeAdmin, async (req, res) => {
  try {
    console.log('[Station] PUT /stations/:id - Request params:', req.params);
    console.log('[Station] PUT /stations/:id - Request body:', req.body);
    console.log('[Station] PUT /stations/:id - User:', req.user);
    
    const { id } = req.params;
    const { name, location, description, latitude, longitude, status, sensorTypeIds } = req.body;
    
    // Validation
    if (!name || !location) {
      console.log('[Station] PUT /stations/:id - Missing required fields');
      return res.status(400).json({ success: false, message: 'Missing required fields: name and location are required' });
    }
    
    if (latitude === undefined || longitude === undefined) {
      console.log('[Station] PUT /stations/:id - Missing coordinates');
      return res.status(400).json({ success: false, message: 'Missing required fields: latitude and longitude are required' });
    }
    
    const pool = await getPool();
    
    // Cập nhật thông tin trạm
    console.log('[Station] PUT /stations/:id - Updating station with data:', { id, name, location, description, latitude, longitude, status });
    
    const result = await pool.request()
      .input('Id', sql.Int, id)
      .input('Name', sql.NVarChar, name)
      .input('Location', sql.NVarChar, location)
      .input('Description', sql.NVarChar, description || null)
      .input('Latitude', sql.Decimal(10, 6), latitude)
      .input('Longitude', sql.Decimal(10, 6), longitude)
      .input('Status', sql.NVarChar, status)
      .query(`UPDATE Stations SET Name=@Name, Location=@Location, Description=@Description, Latitude=@Latitude, Longitude=@Longitude, Status=@Status WHERE Id=@Id; SELECT * FROM Stations WHERE Id=@Id`);
    
    if (result.recordset.length === 0) {
      console.log('[Station] PUT /stations/:id - Station not found');
      return res.status(404).json({ success: false, message: 'Station not found' });
    }
    
    console.log('[Station] PUT /stations/:id - Station updated:', result.recordset[0]);
    
    // Lấy sensorTypeId của Battery
    const batterySensor = await pool.request().query(`SELECT Id FROM SensorTypes WHERE LOWER(Name) = 'battery'`);
    const batteryId = batterySensor.recordset[0]?.Id;
    console.log('[Station] PUT /stations/:id - Battery sensor ID:', batteryId);
    
    // Lấy danh sách sensor hiện tại của trạm
    const currentSensors = await pool.request().input('StationId', sql.Int, id).query('SELECT SensorTypeId FROM StationSensors WHERE StationId=@StationId');
    const currentSensorIds = currentSensors.recordset.map(r => r.SensorTypeId);
    console.log('[Station] PUT /stations/:id - Current sensor IDs:', currentSensorIds);
    
    // Lấy các sensor đã có dữ liệu
    const sensorsWithData = await pool.request().input('StationId', sql.Int, id).query('SELECT DISTINCT SensorTypeId FROM SensorReadings WHERE StationId=@StationId');
    const sensorsWithDataIds = sensorsWithData.recordset.map(r => r.SensorTypeId);
    console.log('[Station] PUT /stations/:id - Sensors with data IDs:', sensorsWithDataIds);
    
    // Luôn giữ lại Battery
    const mustKeepIds = Array.from(new Set([...(sensorsWithDataIds || []), batteryId].filter(Boolean)));
    console.log('[Station] PUT /stations/:id - Must keep sensor IDs:', mustKeepIds);
    
    // Danh sách sensor sẽ giữ lại: các sensor đã có dữ liệu + các sensor được chọn mới (sensorTypeIds)
    const newSensorIds = Array.from(new Set([...(sensorTypeIds || []), batteryId].filter(Boolean)));
    console.log('[Station] PUT /stations/:id - New sensor IDs:', newSensorIds);
    
    // Kiểm tra xem có sensor nào có dữ liệu nhưng bị bỏ tích không
    const sensorsToRemove = currentSensorIds.filter(sensorId => !newSensorIds.includes(sensorId));
    const sensorsWithDataToRemove = sensorsToRemove.filter(sensorId => sensorsWithDataIds.includes(sensorId) && sensorId !== batteryId);
    
    if (sensorsWithDataToRemove.length > 0) {
      // Lấy tên các sensor để hiển thị trong thông báo lỗi
      const sensorNames = [];
      for (const sensorId of sensorsWithDataToRemove) {
        const sensorNameResult = await pool.request()
          .input('SensorTypeId', sql.Int, sensorId)
          .query('SELECT Name FROM SensorTypes WHERE Id=@SensorTypeId');
        if (sensorNameResult.recordset.length > 0) {
          sensorNames.push(sensorNameResult.recordset[0].Name);
        }
      }
      
      console.log('[Station] PUT /stations/:id - Cannot remove sensors with data:', sensorNames);
      
      return res.status(400).json({ 
        success: false, 
        message: 'Cảm biến này đã có dữ liệu không thể cập nhật'
      });
    }
    
    // Xóa các sensor chưa có dữ liệu và không nằm trong newSensorIds
    for (const sensorId of currentSensorIds) {
      if (!mustKeepIds.includes(sensorId) && !newSensorIds.includes(sensorId)) {
        console.log('[Station] PUT /stations/:id - Removing sensor ID:', sensorId);
        await pool.request()
          .input('StationId', sql.Int, id)
          .input('SensorTypeId', sql.Int, sensorId)
          .query('DELETE FROM StationSensors WHERE StationId=@StationId AND SensorTypeId=@SensorTypeId');
      }
    }
    
    // Thêm các sensor mới (chưa có trong StationSensors)
    for (const sensorTypeId of newSensorIds) {
      if (!currentSensorIds.includes(sensorTypeId)) {
        console.log('[Station] PUT /stations/:id - Adding new sensor ID:', sensorTypeId);
        await pool.request()
          .input('StationId', sql.Int, id)
          .input('SensorTypeId', sql.Int, sensorTypeId)
          .query('INSERT INTO StationSensors (StationId, SensorTypeId) VALUES (@StationId, @SensorTypeId)');
      }
    }
    
    console.log('[Station] PUT /stations/:id - Success, returning updated station data');
    res.json({ success: true, data: result.recordset[0] });
    
  } catch (error) {
    console.error('[Station] PUT /stations/:id - Error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

module.exports = router; 