export interface MonthlyAirQualityData {
  id: string;
  name: string;
  monthlyData: {
    uv: number[];      // 12 months of UV index data
    pm25: number[];    // 12 months of PM2.5 data
    pm1_0: number[];   // 12 months of PM1.0 data
  };
}

export const yearlyStationData: MonthlyAirQualityData[] = [
  {
    id: 'A001',
    name: 'Trung Tâm R&D',
    monthlyData: {
      uv: [7.2, 7.8, 8.4, 8.9, 9.2, 9.8, 10.1, 9.7, 9.3, 8.6, 8.1, 7.5],
      pm25: [28.5, 26.2, 24.8, 22.1, 25.7, 29.3, 32.4, 35.1, 31.8, 28.9, 30.2, 33.6],
      pm1_0: [45.2, 42.8, 40.1, 38.7, 44.5, 48.9, 52.3, 55.8, 51.2, 47.6, 49.3, 53.1],
    },
  },
  {
    id: 'A002', 
    name: 'Ban Quản Lý Khu CNC',
    monthlyData: {
      uv: [6.8, 7.4, 8.0, 8.5, 8.8, 9.4, 9.7, 9.3, 8.9, 8.2, 7.7, 7.1],
      pm25: [25.1, 23.8, 21.5, 19.7, 23.3, 26.9, 29.8, 32.5, 28.4, 25.6, 27.8, 30.2],
      pm1_0: [41.8, 39.4, 36.7, 35.3, 41.1, 45.5, 48.9, 52.4, 47.8, 44.2, 46.9, 49.7],
    },
  },
  {
    id: 'A003',
    name: 'Vườn Ươm Doanh Nghiệp', 
    monthlyData: {
      uv: [7.6, 8.2, 8.8, 9.3, 9.6, 10.2, 10.5, 10.1, 9.7, 9.0, 8.5, 7.9],
      pm25: [31.2, 28.9, 26.5, 24.2, 28.1, 31.7, 35.0, 38.2, 34.5, 31.3, 33.6, 36.9],
      pm1_0: [48.6, 46.2, 43.5, 42.1, 47.9, 52.3, 55.7, 59.2, 54.6, 51.0, 53.7, 56.5],
    },
  },
];

// Calculate average data across all stations for each month
export const calculateMonthlyAverageData = () => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const averageData = {
    labels: monthNames,
    datasets: [
      {
        label: 'UV Index',
        data: Array.from({ length: 12 }, (_, monthIndex) => {
          const sum = yearlyStationData.reduce((acc, station) => acc + station.monthlyData.uv[monthIndex], 0);
          return Number((sum / yearlyStationData.length).toFixed(1));
        }),
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
      {
        label: 'PM2.5',
        data: Array.from({ length: 12 }, (_, monthIndex) => {
          const sum = yearlyStationData.reduce((acc, station) => acc + station.monthlyData.pm25[monthIndex], 0);
          return Number((sum / yearlyStationData.length).toFixed(1));
        }),
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      },
      {
        label: 'PM1.0',
        data: Array.from({ length: 12 }, (_, monthIndex) => {
          const sum = yearlyStationData.reduce((acc, station) => acc + station.monthlyData.pm1_0[monthIndex], 0);
          return Number((sum / yearlyStationData.length).toFixed(1));
        }),
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
    ],
  };
  
  return averageData;
};

// Get monthly data for a specific station
export const getStationMonthlyData = (stationId: string) => {
  const station = yearlyStationData.find(s => s.id === stationId);
  if (!station) return null;
  
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  return {
    labels: monthNames,
    datasets: [
      {
        label: 'UV Index',
        data: station.monthlyData.uv,
        backgroundColor: '#3B82F6',
        borderRadius: 4,
      },
      {
        label: 'PM2.5',
        data: station.monthlyData.pm25,
        backgroundColor: '#F59E0B',
        borderRadius: 4,
      },
      {
        label: 'PM1.0',
        data: station.monthlyData.pm1_0,
        backgroundColor: '#10B981',
        borderRadius: 4,
      },
    ],
  };
}; 