# Hướng Dẫn Sử Dụng API Input Data

POST http://localhost:5003/input-data/

## Headers
```
Content-Type: application/json
X-API-Key: YOUR_API_KEY
```
## API KEY: Q9v7!x2T$kL4@z8N#pR6^wY1*eF5%uJ3
## Cấu Trúc Request Body
### Bắt buộc:
```json
{
  "device_name": "string",     // Tên trạm (phải tồn tại trong database)
  "readings": [                // Mảng dữ liệu sensor
    {
      "type": "string",        // Loại sensor (uv, pm25, pm10)
      "value": number,         // Giá trị số (không âm)
      "unit": "string"         // Đơn vị kèm theo để xác định đúng loại sensor
    }
  ]
}
```

## Ví Dụ CURL

### 1. Gửi dữ liệu cơ bản:
```bash
curl -X POST http://localhost:5003/input-data/ \
  -H "Content-Type: application/json" \
  -H "X-API-Key: Q9v7!x2T$kL4@z8N#pR6^wY1*eF5%uJ3" \
  -d '{
    "device_name": "[CNC]Sensor_A",
    "readings": [
      {
        "type": "uv",
        "value": 3,
        "unit": "index"
      },
      {
        "type": "pm2.5",
        "value": 10,
        "unit": "μg/m³"
      },
      {
        "type": "pm10", 
        "value": 15,
        "unit": "μg/m³"
      },
      {
      "type": "battery",
      "value": 3600,
      "unit": "mV"
      }
    ]
  }'
```

## Response Thành Công
### Khi gửi đủ sensor:
```json
{
  "device_name": "Station001",
  "timestamp": "2025-07-11T10:01:49.964Z",
  "readings": [
    {
      "type": "uv",
      "value": 3,
      "unit": "index"
    },
    {
      "type": "pm2.5",
      "value": 10,
      "unit" : "μg/m³"
    },
    {
      "type": "pm10",
      "value": 15,
      "unit" : "μg/m³"
    },
    {
      "type": "battery",
      "value": 3600,
      "unit": "mV"
      }
  ],
  "message": "Thêm dữ liệu mới thành công"
}
```

### Khi gửi thiếu sensor:
```json
{
  "device_name": "Station001", 
  "readings": [
    {
      "type": "pm2.5",
      "value": 45.2, 
      "unit" : "μg/m³"
    }
  ],
  "message": "Chỉ có những sensor này được thêm: pm25"
}
```

## Response Lỗi

### 400 - Dữ liệu không hợp lệ:
```json
{
  "error": {
    "code": 400,
    "message": "Trạm này không tồn tại"
  }
}
```

### 401 - Sai API Key:
```json
{
  "error": {
    "code": 401,
    "message": "Invalid API key"
  }
}
```

### 500 - Lỗi server:
```json
{
  "error": {
    "code": 500,
    "message": "Internal server error",
    "details": "Error details..."
  }
}
```

## Lưu Ý Quan Trọng

1. **device_name**: Phải là tên trạm đã tồn tại trong database và có status = 'active'
2. **readings.type**: Phải là loại sensor mà trạm được cấu hình (không phân biệt hoa thường)
3. **readings.value**: Phải là số không âm

4. **API Key**: Bắt buộc phải có trong header X-API-Key
5. **Không trùng lặp**: Mỗi loại sensor chỉ được gửi một lần trong một request

## Các Loại Sensor Hiện có trong trạm
- uv, pm2.5, pm10

## Tên các trạm có trong database: 
[CNC]Sensor_A
[CNC]Sensor_B
[CNC]Sensor_C

## Ví dụ truyền đúng BODY
```json
{
  "device_name": "[CNC]Sensor_A",
  "readings": [
    {
      "type": "uv",
      "value": 1,
      "unit": "index"
    },
    {
      "type": "pm2.5",
      "value": 6,
      "unit": "μg/m³"
    },
    {
      "type": "pm10",
      "value": 15,
      "unit": "μg/m³"
    },
    {
      "type": "battery",
      "value": 3600,
      "unit": "mV"
    }
  ]
}