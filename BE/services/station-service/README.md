# Station Service API

Service quản lý thông tin trạm quan trắc với đầy đủ thông tin sensors và dữ liệu cập nhật gần nhất.

## Các API Endpoints

### 1. GET /stations/list
Lấy danh sách trạm cơ bản (chỉ thông tin cơ bản)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "Id": 1,
      "Name": "[ CNC ] Sensor_A",
      "Status": "active",
      "Location": "Trung Tâm R&D"
    }
  ]
}
```

### 2. GET /stations/detailed-list
Lấy danh sách trạm chi tiết với thông tin sensors và dữ liệu cập nhật gần nhất

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "[ CNC ] Sensor_A",
      "location": "Trung Tâm R&D",
      "latitude": 10.849702969756216,
      "longitude": 106.8025432124687,
      "status": "active",
      "description": "Trung Tâm R&D",
      "createdAt": "2024-06-01T08:00:00.000Z",
      "updatedAt": "2024-06-01T08:00:00.000Z",
      "sensors": [
        {
          "sensorTypeId": 1,
          "sensorName": "UV",
          "sensorDescription": "Cường độ tia cực tím",
          "unit": "index",
          "lastReading": {
            "value": 5.2,
            "recordedAt": "2024-06-01T08:00:00.000Z"
          }
        },
        {
          "sensorTypeId": 2,
          "sensorName": "PM2.5",
          "sensorDescription": "Bụi mịn PM2.5",
          "unit": "µg/m3",
          "lastReading": {
            "value": 35.2,
            "recordedAt": "2024-06-01T08:00:00.000Z"
          }
        }
      ]
    }
  ],
  "total": 1
}
```

### 3. GET /stations/{id}
Lấy thông tin chi tiết của một trạm cụ thể

**Parameters:**
- `id` (path): ID của trạm

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "[ CNC ] Sensor_A",
    "location": "Trung Tâm R&D",
    "latitude": 10.849702969756216,
    "longitude": 106.8025432124687,
    "status": "active",
    "description": "Trung Tâm R&D",
    "createdAt": "2024-06-01T08:00:00.000Z",
    "updatedAt": "2024-06-01T08:00:00.000Z",
    "sensors": [
      {
        "sensorTypeId": 1,
        "sensorName": "UV",
        "sensorDescription": "Cường độ tia cực tím",
        "unit": "index",
        "lastReading": {
          "value": 5.2,
          "recordedAt": "2024-06-01T08:00:00.000Z"
        }
      }
    ]
  }
}
```

## Cấu trúc dữ liệu

### Station Object
- `id`: ID của trạm
- `name`: Tên trạm
- `location`: Vị trí địa lý
- `latitude`: Vĩ độ
- `longitude`: Kinh độ
- `status`: Trạng thái (active/inactive/maintenance)
- `description`: Mô tả trạm
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật cuối
- `sensors`: Danh sách sensors

### Sensor Object
- `sensorTypeId`: ID loại sensor
- `sensorName`: Tên sensor
- `sensorDescription`: Mô tả sensor
- `unit`: Đơn vị đo
- `lastReading`: Dữ liệu cập nhật gần nhất
  - `value`: Giá trị
  - `recordedAt`: Thời gian ghi nhận

## Authentication

Tất cả các API đều yêu cầu JWT token trong header:
```
Authorization: Bearer <token>
```

## Database Schema

API sử dụng các bảng sau:
- `Stations`: Thông tin trạm
- `SensorTypes`: Loại cảm biến
- `StationSensors`: Liên kết trạm và sensor
- `SensorReadings`: Dữ liệu đo từ sensor

## Query Performance

API `/stations/detailed-list` sử dụng Common Table Expression (CTE) để tối ưu hiệu suất:
- `LatestReadings`: Lấy dữ liệu cập nhật gần nhất cho mỗi sensor
- Sử dụng `ROW_NUMBER()` để xác định bản ghi mới nhất
- JOIN với các bảng liên quan để lấy thông tin đầy đủ

## Error Handling

- `200`: Thành công
- `401`: Unauthorized (thiếu hoặc sai token)
- `404`: Không tìm thấy trạm (cho API GET /stations/{id})
- `500`: Internal server error

## Swagger Documentation

Truy cập `/api-docs` để xem tài liệu API chi tiết với Swagger UI. 