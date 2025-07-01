import { yearlyStationData } from './yearlyData';
import { chartSampleData } from './chartSampleData';

export interface HistoricalReportData {
  period: string;
  uv: number;
  pm25: number;
  pm10: number;
  date: string;
}

// Available years for filtering
export const availableYears = [2024, 2023, 2022, 2021, 2020];

// Historical data patterns for different years
const yearDataMultipliers: Record<number, { uv: number; pm25: number; pm10: number }> = {
  2024: { uv: 1.0, pm25: 1.0, pm10: 1.0 }, // Current year - base data
  2023: { uv: 0.95, pm25: 1.08, pm10: 1.06 }, // Slightly lower UV, higher pollution
  2022: { uv: 0.92, pm25: 1.15, pm10: 1.12 }, // Lower UV, higher pollution
  2021: { uv: 0.88, pm25: 1.22, pm10: 1.18 }, // COVID year - different patterns
  2020: { uv: 0.85, pm25: 1.28, pm10: 1.25 }, // Higher pollution in older years
};

// Get monthly data for a specific station and year
export const getMonthlyHistoricalData = (stationId: string, year: number): HistoricalReportData[] => {
  const stationData = yearlyStationData.find(s => s.id === stationId);
  if (!stationData) return [];

  const multipliers = yearDataMultipliers[year] || yearDataMultipliers[2024];
  const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
                     'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

  return monthNames.map((month, index) => {
    const baseUV = stationData.monthlyData.uv[index];
    const basePM25 = stationData.monthlyData.pm25[index];
    const basePM10 = stationData.monthlyData.pm1_0[index];

    return {
      period: month,
      uv: Number((baseUV * multipliers.uv * (0.95 + Math.random() * 0.1)).toFixed(1)),
      pm25: Number((basePM25 * multipliers.pm25 * (0.95 + Math.random() * 0.1)).toFixed(1)),
      pm10: Number((basePM10 * multipliers.pm10 * (0.95 + Math.random() * 0.1)).toFixed(1)),
      date: `${year}-${(index + 1).toString().padStart(2, '0')}-01`
    };
  });
};

// Get daily data for a specific station and year (using June as sample month)
export const getDailyHistoricalData = (stationId: string, year: number): HistoricalReportData[] => {
  const stationData = chartSampleData.find(s => s.id === stationId);
  if (!stationData) return [];

  const multipliers = yearDataMultipliers[year] || yearDataMultipliers[2024];

  return stationData.airQuality.uv.map((_, index) => {
    const baseUV = stationData.airQuality.uv[index];
    const basePM25 = stationData.airQuality.pm25[index];
    const basePM10 = stationData.airQuality.pm1_0[index];

    return {
      period: `Ngày ${index + 1}`,
      uv: Number((baseUV * multipliers.uv * (0.95 + Math.random() * 0.1)).toFixed(1)),
      pm25: Number((basePM25 * multipliers.pm25 * (0.95 + Math.random() * 0.1)).toFixed(1)),
      pm10: Number((basePM10 * multipliers.pm10 * (0.95 + Math.random() * 0.1)).toFixed(1)),
      date: `${year}-06-${(index + 1).toString().padStart(2, '0')}`
    };
  });
}; 