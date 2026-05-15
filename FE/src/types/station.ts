export interface SensorData {
    id: number;
    name: string;
    value: number | null;
    unit: string;
    recordedAt: string;
    level?: number | null;
}

export interface StationData {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    sensors: SensorData[];
    status: 'online' | 'offline' | 'maintenance';
    lastUpdated?: string;
    location?: string;
}

// Interface cho dữ liệu truyền vào biểu đồ thống kê
export interface StationChartData {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    airQuality: {
        uv: number[]; // Dữ liệu UV theo ngày/tháng
        pm25: number[];
        pm1_0: number[];
    };
    battery?: number[];
    status: ('online' | 'offline' | 'maintenance')[];
    lastUpdated?: string[];
} 