import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import type { StationChartData, StationData } from '../types/station';
import { fetchStationsList, fetchStationDailyStatistics, fetchStationMonthlyStatistics, fetchHourlyStatistics, fetchDistribution, fetchStationSensors } from '../services/dataApi';
import StationSelector from '../components/StationSelector';

// Đăng ký các component Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

// Màu cho các sensor, nếu nhiều hơn thì tự động lặp lại
const colorList = [
    { border: '#3B82F6', bg: 'rgba(59,130,246,0.1)' }, // blue
    { border: '#10B981', bg: 'rgba(16,185,129,0.1)' }, // green
    { border: '#F59E0B', bg: 'rgba(245,158,11,0.1)' }, // yellow
    { border: '#EF4444', bg: 'rgba(239,68,68,0.1)' },  // red
    { border: '#6366F1', bg: 'rgba(99,102,241,0.1)' }, // indigo
];

// Hàm xử lý dữ liệu động cho chart
function buildChartData(rawData: any[], timeKey: string, barAlphaOverride?: number) {
    if (!rawData || rawData.length === 0) return { labels: [], datasets: [], sensorKeys: [] };
    const labels = rawData.map(item => item[timeKey]);
    const sensorKeys = Object.keys(rawData[0]).filter(key => key !== timeKey && key !== 'Battery');
    const datasets = sensorKeys.map((key, idx) => {
        let backgroundColor = colorList[idx % colorList.length].bg;
        // Nếu là biểu đồ Bar (năm), override alpha nếu có
        if (barAlphaOverride !== undefined) {
            // Lấy mã màu gốc và thay alpha
            const rgb = colorList[idx % colorList.length].bg.match(/rgba\((\d+),(\d+),(\d+),/);
            if (rgb) {
                backgroundColor = `rgba(${rgb[1]},${rgb[2]},${rgb[3]},${barAlphaOverride})`;
            }
        }
        return {
            label: key,
            data: rawData.map(item => item[key]),
            borderColor: colorList[idx % colorList.length].border,
            backgroundColor,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4,
        };
    });
    return { labels, datasets, sensorKeys };
}

// Legend động
function DynamicLegend({ sensorKeys }: { sensorKeys: string[] }) {
    return (
        <div className="flex items-center gap-3">
            {sensorKeys.map((key, idx) => (
                <div key={key} className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full" style={{ background: colorList[idx % colorList.length].border }}></div>
                    <span className="text-xs text-gray-600 font-medium">{key}</span>
                </div>
            ))}
        </div>
    );
}

// Hàm lọc ngày có số liệu
function filterNonNullDays(data: any[], timeKey: string) {
    return data.filter(item =>
        Object.keys(item).some(
            key => key !== timeKey && item[key] !== null && item[key] !== undefined
        )
    );
}

const Statistics: React.FC = () => {
    const [stations, setStations] = useState<StationData[]>([]);
    const [selectedStation, setSelectedStation] = useState<StationData | null>(null);
    const [dailyRawData, setDailyRawData] = useState<any[]>([]);
    const [monthlyRawData, setMonthlyRawData] = useState<any[]>([]);
    const [availableSensors, setAvailableSensors] = useState<Array<{ SensorTypeId: number; Name: string }>>([]);
    const [selectedSensor, setSelectedSensor] = useState<string>('');
    const [hourlyData, setHourlyData] = useState<any>(null);
    const [distributionDataAPI, setDistributionDataAPI] = useState<any>(null);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());

    const handleStationChange = (station: StationData) => setSelectedStation(station);

    // Load danh sách trạm khi mount
    useEffect(() => {
        const loadStations = async () => {
            try {
                const apiStations = await fetchStationsList();
                const mappedStations = (apiStations || []).map((s: any) => ({
                    id: s.Id?.toString() || s.id?.toString() || '',
                    name: s.Name || s.name || '',
                    coordinates: s.Location ? { lat: s.Location.lat || 0, lng: s.Location.lng || 0 } : { lat: 0, lng: 0 },
                    status: s.Status === 'active' ? 'online' : (s.Status === 'maintenance' ? 'maintenance' : 'offline'),
                    location: s.Location || '',
                    sensors: [],
                }));
                setStations(mappedStations);
                if (mappedStations.length > 0) setSelectedStation(mappedStations[0]);
            } catch (error) { }
        };
        loadStations();
    }, []);

    // Khi chọn trạm, lấy danh sách cảm biến của trạm đó
    useEffect(() => {
        const loadStationSensors = async () => {
            if (!selectedStation) {
                setAvailableSensors([]);
                setSelectedSensor('');
                return;
            }
            try {
                const sensors = await fetchStationSensors(selectedStation.id);
                // Lọc bỏ battery khỏi danh sách sensors
                const sensorList = (sensors || [])
                    .filter((s: any) => s.Name && s.Name.toLowerCase() !== 'battery')
                    .map((s: any) => ({
                        SensorTypeId: s.SensorTypeId,
                        Name: s.Name
                    }));
                setAvailableSensors(sensorList);
                // Tự động chọn sensor đầu tiên nếu có
                if (sensorList.length > 0) {
                    setSelectedSensor(sensorList[0].Name);
                } else {
                    setSelectedSensor('');
                }
            } catch (error) {
                console.error('Error loading station sensors:', error);
                setAvailableSensors([]);
                setSelectedSensor('');
            }
        };
        loadStationSensors();
    }, [selectedStation]);

    // Khi chọn trạm hoặc năm, gọi API thống kê
    useEffect(() => {
        const fetchStatistics = async () => {
            if (!selectedStation || !selectedSensor) return;
            try {
                const [daily, monthly] = await Promise.all([
                    fetchStationDailyStatistics(selectedStation.id),
                    fetchStationMonthlyStatistics(selectedStation.id, selectedYear)
                ]);
                setDailyRawData(daily || []);
                setMonthlyRawData(monthly || []);
            } catch (error) {
                setDailyRawData([]);
                setMonthlyRawData([]);
            }
        };
        fetchStatistics();
    }, [selectedStation, selectedSensor, selectedYear]);

    // Khi thay đổi sensor, load lại hourly data và distribution
    useEffect(() => {
        const fetchHourly = async () => {
            if (!selectedStation || !selectedSensor) return;
            try {
                const [hourly, distribution] = await Promise.all([
                    fetchHourlyStatistics(selectedStation.id, selectedSensor, 7),
                    fetchDistribution(selectedStation.id, selectedSensor, 'month')
                ]);
                setHourlyData(hourly);
                setDistributionDataAPI(distribution);
            } catch (error) {
                setHourlyData(null);
            }
        };
        fetchHourly();
    }, [selectedStation, selectedSensor]);

    // Lọc ngày có số liệu trước khi build chart
    const filteredDailyRawData = filterNonNullDays(dailyRawData, 'date');
    const dailyChart = buildChartData(filteredDailyRawData, 'date');
    const monthlyChart = buildChartData(monthlyRawData, 'month', 0.6);

    // === DATA cho biểu đồ mới ===

    // 1. Biểu đồ Phân Bố Mức Độ (Doughnut) - Chỉ dùng dữ liệu từ API
    const distributionData = distributionDataAPI ? {
        labels: ['Tốt', 'Trung bình', 'Kém', 'Xấu'],
        datasets: [{
            data: [
                distributionDataAPI.Level1Percent || 0,
                distributionDataAPI.Level2Percent || 0,
                distributionDataAPI.Level3Percent || 0,
                distributionDataAPI.Level4Percent || 0
            ],
            backgroundColor: ['#10B981', '#FBBF24', '#F59E0B', '#EF4444'],
            borderColor: ['#059669', '#F59E0B', '#D97706', '#DC2626'],
            borderWidth: 2,
        }],
    } : {
        labels: ['Tốt', 'Trung bình', 'Kém', 'Xấu'],
        datasets: [{
            data: [0, 0, 0, 0],
            backgroundColor: ['#10B981', '#FBBF24', '#F59E0B', '#EF4444'],
            borderColor: ['#059669', '#F59E0B', '#D97706', '#DC2626'],
            borderWidth: 2,
        }],
    };

    const distributionOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    font: { size: 12 },
                    padding: 12,
                    usePointStyle: true,
                    boxWidth: 12,
                },
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                padding: 12,
                titleFont: { size: 13, weight: '600' },
                bodyFont: { size: 12 },
                callbacks: {
                    label: (context: any) => {
                        return `${context.label}: ${context.parsed}%`;
                    }
                }
            },
        },
        cutout: '65%',
    };

    // 2. Heat Map Data - Transform từ API
    const generateHeatmapData = () => {
        const hours = Array.from({ length: 24 }, (_, i) => `${i}h`);

        if (hourlyData && Array.isArray(hourlyData) && hourlyData.length > 0) {
            // Transform API data
            const values: number[][] = [];
            const dates: string[] = [];
            const dayLabels: string[] = [];

            const sortedData = [...hourlyData].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            const last7Days = sortedData.slice(0, 7).reverse();

            for (const dayData of last7Days) {
                const dayValues: number[] = [];
                const date = new Date(dayData.date);
                const dayOfWeek = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
                const dateStr = `${date.getDate()}/${date.getMonth() + 1}`;

                dates.push(dayData.date);
                dayLabels.push(`${dayOfWeek} (${dateStr})`);

                for (let hour = 0; hour < 24; hour++) {
                    const hourValue = dayData.hourlyValues?.find((h: any) => h.hour === hour);
                    dayValues.push(hourValue ? Math.round(hourValue.value) : 0);
                }
                values.push(dayValues);
            }

            const fromDate = new Date(last7Days[0].date);
            const toDate = new Date(last7Days[last7Days.length - 1].date);
            const dateRange = `${fromDate.getDate()}/${fromDate.getMonth() + 1}/${fromDate.getFullYear()} - ${toDate.getDate()}/${toDate.getMonth() + 1}/${toDate.getFullYear()}`;

            return { days: dayLabels, hours, values, dates, dateRange, isEmpty: false };
        }

        // Không có dữ liệu - trả về object rỗng
        return { days: [], hours, values: [], dates: [], dateRange: null, isEmpty: true };
    };

    const heatmapData = generateHeatmapData();

    // Summary Cards Data - từ distribution API
    const summaryData = distributionDataAPI ? {
        good: distributionDataAPI.Level1 || 0,
        moderate: distributionDataAPI.Level2 || 0,
        poor: distributionDataAPI.Level3 || 0,
        bad: distributionDataAPI.Level4 || 0,
        goodPercent: distributionDataAPI.Level1Percent || 0,
        moderatePercent: distributionDataAPI.Level2Percent || 0,
        poorPercent: distributionDataAPI.Level3Percent || 0,
        badPercent: distributionDataAPI.Level4Percent || 0,
    } : {
        good: 0, moderate: 0, poor: 0, bad: 0,
        goodPercent: 0, moderatePercent: 0, poorPercent: 0, badPercent: 0,
    };

    const getHeatmapColor = (value: number) => {
        if (value < 25) return 'bg-green-300';
        if (value < 40) return 'bg-green-200';
        if (value < 55) return 'bg-yellow-200';
        if (value < 70) return 'bg-orange-300';
        if (value < 90) return 'bg-red-400';
        return 'bg-red-600';
    };

    const getHeatmapTextColor = (value: number) => {
        if (value < 70) return 'text-gray-800';
        return 'text-white font-semibold';
    };

    // Chart options for yearly bar chart
    const yearlyChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
            legend: {
                display: false, // Hide legend since it's now in header
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                titleFont: {
                    size: 14,
                    weight: '600',
                },
                bodyFont: {
                    size: 13,
                },
            },
        },
        scales: {
            x: {
                grid: {
                    display: false,
                },
                border: {
                    color: '#E5E7EB',
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    maxRotation: 0,
                },
            },
            y: {
                beginAtZero: true,
                max: 150,
                grid: {
                    color: 'rgba(229, 231, 235, 0.4)',
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    padding: 8,
                    stepSize: 15,
                },
            },
        },
        layout: {
            padding: {
                top: 5,
                bottom: 5,
            },
        },
        barThickness: 'flex',
        categoryPercentage: 0.8,
        barPercentage: 0.9,
    };

    // Chart options for daily trend line chart - Updated to show all 31 days
    const dailyChartOptions: any = {
        responsive: true,
        maintainAspectRatio: false,
        resizeDelay: 0,
        plugins: {
            legend: {
                display: false, // Hide legend since it's now in header
            },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#1F2937',
                bodyColor: '#374151',
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1,
                cornerRadius: 8,
                padding: 12,
                mode: 'index' as const,
                intersect: false,
                titleFont: {
                    size: 13,
                    weight: '600',
                },
                bodyFont: {
                    size: 12,
                },
                displayColors: true,
                boxWidth: 8,
                boxHeight: 8,
                callbacks: {
                    title: function (context: any) {
                        return `Ngày ${context[0].label}`;
                    },
                    label: function (context: any) {
                        const label = context.dataset.label;
                        const value = context.parsed.y;

                        if (label === 'UV Index') {
                            return `${label}: ${value.toFixed(1)}`;
                        } else if (label === 'PM2.5' || label === 'PM1.0') {
                            return `${label}: ${value.toFixed(1)} μg/m³`;
                        }
                        return `${label}: ${value}`;
                    }
                },
                filter: function (tooltipItem: any) {
                    return tooltipItem.parsed.y !== null;
                }
            },
        },
        scales: {
            x: {
                grid: {
                    display: true,
                    color: 'rgba(229, 231, 235, 0.3)',
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    maxRotation: 0,
                    padding: 8,
                },
            },
            y: {
                beginAtZero: true,
                max: 150,
                grid: {
                    color: 'rgba(229, 231, 235, 0.4)',
                    drawBorder: false,
                },
                border: {
                    display: false,
                },
                ticks: {
                    color: '#6B7280',
                    font: {
                        size: 11,
                    },
                    padding: 8,
                    stepSize: 15,
                },
            },
        },
        elements: {
            point: {
                radius: 0,
                hoverRadius: 5,
                hoverBorderWidth: 2,
                hoverBackgroundColor: '#ffffff',
            },
            line: {
                borderWidth: 2,
                tension: 0.4,
            },
        },
        interaction: {
            mode: 'index' as const,
            intersect: false,
            axis: 'x',
        },
        layout: {
            padding: {
                top: 2,
                bottom: 5,
                left: 5,
                right: 5,
            },
        },
    };

    return (
        <Layout>
            <div className="flex flex-col h-full overflow-hidden">
                {/* Header */}
                <div className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 flex-shrink-0 flex items-center justify-between border-b border-gray-200 bg-white">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Thống kê chất lượng không khí</h1>
                        <p className="text-gray-600 text-sm">Dữ liệu chi tiết về các chỉ số môi trường</p>
                    </div>
                    <div className="min-w-[250px]">
                        <StationSelector
                            stations={stations}
                            selectedStation={selectedStation}
                            onStationChange={setSelectedStation}
                            placeholder="Chọn trạm để thống kê"
                        />
                    </div>
                </div>

                {/* Main Content - Scrollable */}
                <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 bg-gray-50">
                    <div className="space-y-4 max-w-[1600px] mx-auto">
                        {/* Row 1: Summary Cards - Tổng quan nhanh */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-green-900">Ngày tốt</h4>
                                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-green-900">{summaryData.good}</p>
                                <p className="text-xs text-green-700 mt-1">{summaryData.goodPercent}% tháng này</p>
                            </div>

                            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-xl p-4 border border-yellow-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-yellow-900">Trung bình</h4>
                                    <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-yellow-900">{summaryData.moderate}</p>
                                <p className="text-xs text-yellow-700 mt-1">{summaryData.moderatePercent}% tháng này</p>
                            </div>

                            <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-orange-900">Kém</h4>
                                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-orange-900">{summaryData.poor}</p>
                                <p className="text-xs text-orange-700 mt-1">{summaryData.poorPercent}% tháng này</p>
                            </div>

                            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 border border-red-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-sm font-semibold text-red-900">Xấu</h4>
                                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <p className="text-2xl font-bold text-red-900">{summaryData.bad}</p>
                                <p className="text-xs text-red-700 mt-1">{summaryData.badPercent}% tháng này</p>
                            </div>
                        </div>

                        {/* Row 2: Heat Map + Biểu đồ phân bố */}
                        <div className="flex flex-col xl:flex-row gap-4 items-stretch">
                            {/* Heat Map theo giờ - Tự động chiếm toàn bộ phần còn lại */}
                            <div className="flex-1 min-w-0 bg-white rounded-2xl shadow-lg border border-gray-100 p-4 xl:p-5 flex flex-col">
                                <div className="mb-3 xl:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                    <div className="min-w-0">
                                        <h3 className="text-sm xl:text-base font-semibold text-gray-900 truncate">
                                            📅 Bản đồ nhiệt {selectedSensor} theo giờ
                                        </h3>
                                        <p className="text-[11px] xl:text-xs text-gray-500 mt-1">
                                            {heatmapData.dateRange ? (
                                                <span>Dữ liệu 7 ngày gần nhất từ <span className="font-semibold text-blue-600">{heatmapData.dateRange.split(' - ')[0]}</span> đến <span className="font-semibold text-blue-600">{heatmapData.dateRange.split(' - ')[1]}</span></span>
                                            ) : (
                                                'Dữ liệu 7 ngày gần nhất'
                                            )}
                                        </p>
                                    </div>
                                    <select
                                        value={selectedSensor}
                                        onChange={(e) => setSelectedSensor(e.target.value)}
                                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        disabled={availableSensors.length === 0}
                                    >
                                        {availableSensors.length === 0 ? (
                                            <option value="">Không có cảm biến</option>
                                        ) : (
                                            availableSensors.map((sensor) => (
                                                <option key={sensor.SensorTypeId} value={sensor.Name}>
                                                    {sensor.Name}
                                                </option>
                                            ))
                                        )}
                                    </select>
                                </div>

                                {heatmapData.isEmpty ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                                        <svg className="w-16 h-16 mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                        </svg>
                                        <p className="text-base font-medium">Không có dữ liệu</p>
                                        <p className="text-sm mt-1">Không tìm thấy dữ liệu cho cảm biến {selectedSensor} trong 7 ngày gần nhất</p>
                                    </div>
                                ) : (
                                    <div className="overflow-x-auto mt-2 xl:mt-3">
                                        <table className="w-full border-collapse text-[10px] xl:text-xs">
                                            <thead>
                                                <tr>
                                                    <th className="sticky left-0 z-10 border border-gray-300 px-2 xl:px-3 py-1.5 xl:py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-[11px] xl:text-sm font-bold text-gray-800">
                                                        Ngày
                                                    </th>
                                                    {heatmapData.hours.map((hour: string) => (
                                                        <th
                                                            key={hour}
                                                            className="border border-gray-300 px-1.5 xl:px-2 py-1.5 xl:py-2 bg-gray-50 text-[10px] xl:text-xs font-semibold text-gray-700 min-w-[38px] xl:min-w-[45px]"
                                                        >
                                                            {hour}
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {heatmapData.days.map((day: string, dayIdx: number) => {
                                                    const fullDate = heatmapData.dates?.[dayIdx];
                                                    const dateObj = fullDate ? new Date(fullDate) : null;
                                                    const dateDisplay = dateObj
                                                        ? `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`
                                                        : day;

                                                    return (
                                                        <tr key={day} className="hover:bg-gray-50">
                                                            <td className="sticky left-0 z-10 border border-gray-300 px-2 xl:px-3 py-1.5 xl:py-2 bg-gradient-to-r from-gray-100 to-gray-50 text-[11px] xl:text-sm font-bold text-gray-800 text-center">
                                                                {day}
                                                            </td>
                                                            {heatmapData.values[dayIdx].map((value: number, hourIdx: number) => (
                                                                <td
                                                                    key={hourIdx}
                                                                    className={`border border-gray-200 px-1.5 xl:px-2 py-1.5 xl:py-2 text-center text-[10px] xl:text-xs font-medium ${getHeatmapColor(value)} ${getHeatmapTextColor(value)} transition-all duration-150 cursor-pointer hover:scale-110 hover:shadow-lg hover:z-20 relative`}
                                                                    title={`📅 ${dateDisplay}\n🕐 ${heatmapData.hours[hourIdx]}\n📊 ${selectedSensor}: ${value} ${selectedSensor.includes('UV') ? '' : 'μg/m³'}`}
                                                                >
                                                                    {value}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>

                            {/* Biểu đồ Phân Bố - Khung cố định, Heat Map chiếm phần còn lại */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 w-full xl:w-[260px] ml-auto xl:ml-0 flex-shrink-0">
                                <div className="mb-3">
                                    <h3 className="text-base font-semibold text-gray-900">🍩 Phân bố chất lượng</h3>
                                    <p className="text-xs text-gray-500 mt-1">Tỷ lệ % mức độ (Tháng này)</p>
                                </div>
                                <div className="h-52 flex items-center justify-center">
                                    <Doughnut data={distributionData} options={distributionOptions} />
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                                            <span className="text-gray-600">Ngày tốt</span>
                                        </div>
                                        <span className="font-semibold text-green-700">{summaryData.good}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                                            <span className="text-gray-600">Trung bình</span>
                                        </div>
                                        <span className="font-semibold text-yellow-700">{summaryData.moderate}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                                            <span className="text-gray-600">Kém</span>
                                        </div>
                                        <span className="font-semibold text-orange-700">{summaryData.poor}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                                            <span className="text-gray-600">Xấu</span>
                                        </div>
                                        <span className="font-semibold text-red-700">{summaryData.bad}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Row 3: Biểu đồ tháng + Biểu đồ năm (1 hàng 2 cột) */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                            {/* Biểu đồ tháng */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                                <div className="p-4 border-b border-gray-100">
                                    <h2 className="text-base font-semibold text-gray-900">📈 Xu hướng chỉ số trong tháng</h2>
                                    <div className="flex items-center gap-3 mt-2">
                                        <p className="text-xs text-gray-500">Dữ liệu các chỉ số động theo ngày</p>
                                        <DynamicLegend sensorKeys={dailyChart.sensorKeys || []} />
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="w-full h-72">
                                        {dailyChart && <Line data={dailyChart as any} options={dailyChartOptions} />}
                                    </div>
                                </div>
                            </div>

                            {/* Biểu đồ năm */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
                                <div className="p-4 border-b border-gray-100">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                        <div>
                                            <h2 className="text-base font-semibold text-gray-900">📊 Xu hướng chỉ số trong năm</h2>
                                            <div className="flex items-center gap-3 mt-2 flex-wrap">
                                                <p className="text-xs text-gray-500">Dữ liệu các chỉ số động theo tháng</p>
                                                <DynamicLegend sensorKeys={monthlyChart.sensorKeys || []} />
                                            </div>
                                        </div>
                                        <select
                                            value={selectedYear}
                                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-w-[100px]"
                                        >
                                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                                <option key={y} value={y}>{y}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="w-full h-72">
                                        {monthlyChart && <Bar data={monthlyChart as any} options={yearlyChartOptions} />}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Statistics; 