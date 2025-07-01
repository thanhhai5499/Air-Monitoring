export interface StationData {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
    airQuality: {
        uv: number | null;
        pm25: number | null;
        pm1_0: number | null;
        uvTrend?: number;
        pm25Trend?: number;
        pm1_0Trend?: number;
    };
    battery?: number;
    status: 'online' | 'offline' | 'maintenance';
    lastUpdated?: string;
    ipAddress?: string;
    port?: number;
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