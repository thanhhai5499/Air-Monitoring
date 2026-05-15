// Data interfaces for historical and yearly data

export interface HistoricalReportData {
    period: string;
    uv: number;
    pm25: number;
    pm10: number;
    date: string;
}

export interface MonthlyAirQualityData {
    id: string;
    name: string;
    monthlyData: {
        uv: number[];      // 12 months of UV index data
        pm25: number[];    // 12 months of PM2.5 data
        pm1_0: number[];   // 12 months of PM1.0 data
    };
} 