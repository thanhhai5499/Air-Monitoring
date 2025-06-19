import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import type { StationChartData, StationData } from '../types/station';
import { chartSampleData } from '../data/chartSampleData';
import { getStationMonthlyData } from '../data/yearlyData';
import StationSelector from '../components/StationSelector';
import { mockStations } from '../data/mockStations';

// Đăng ký các component Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const Statistics: React.FC = () => {
    const [selectedStation, setSelectedStation] = useState<StationData | null>(mockStations[0]);
    const [chartData, setChartData] = useState<any>(null);
    const [yearlyChartData, setYearlyChartData] = useState<any>(null);
    
    const handleStationChange = (station: StationData) => setSelectedStation(station);

    // Initialize chart data on component mount
    useEffect(() => {
        if (mockStations.length > 0) {
            setSelectedStation(mockStations[0]);
            // Generate initial chart data
            setChartData(calculateSelectedStationData());
            setYearlyChartData(calculateYearlyData());
        }
    }, []);

    // Calculate data for selected station
    const calculateSelectedStationData = () => {
        if (!selectedStation) return { labels: [], datasets: [] };
        
        // Find matching station data in chartSampleData
        const stationChartData = chartSampleData.find(station => station.id === selectedStation.id);
        if (!stationChartData) return { labels: [], datasets: [] };

        const labels = stationChartData.airQuality.uv.map((_, i) => i + 1);

        const datasets = [
            {
                label: 'UV Index',
                data: stationChartData.airQuality.uv,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM1.0',
                data: stationChartData.airQuality.pm1_0,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM2.5',
                data: stationChartData.airQuality.pm25,
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ];

        return {
            labels,
            datasets
        };
    };

    const selectedStationChartData = calculateSelectedStationData();

    // Calculate yearly data for selected station
    const calculateYearlyData = () => {
        if (!selectedStation) return { labels: [], datasets: [] };
        
        // Get monthly data from the new yearly data file
        const monthlyData = getStationMonthlyData(selectedStation.id);
        if (!monthlyData) return { labels: [], datasets: [] };

        return monthlyData;
    };

    // Update chart data when selected station changes
    useEffect(() => {
        if (selectedStation) {
            setChartData(calculateSelectedStationData());
            setYearlyChartData(calculateYearlyData());
        }
    }, [selectedStation]);

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
                max: 70,
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
                    stepSize: 10,
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
                    // Show all days of the month
                    callback: function (value: any, index: number) {
                        return index + 1; // Show day numbers 1-31
                    },
                    // Force showing more ticks to display all days
                    maxTicksLimit: 31,
                    autoSkip: false,
                },
            },
            y: {
                beginAtZero: true,
                max: 70,
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
                    stepSize: 10,
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
            <div className="flex flex-col h-full">
                {/* Compact Header */}
                <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Thống kê chất lượng không khí</h1>
                        <p className="text-gray-600 text-sm">Dữ liệu chi tiết về các chỉ số môi trường</p>
                    </div>
                    <div className="min-w-[250px]">
                        <StationSelector
                            stations={mockStations}
                            selectedStation={selectedStation}
                            onStationChange={handleStationChange}
                            placeholder="Chọn trạm để thống kê"
                        />
                    </div>
                </div>

                {/* Charts Container - 2x2 Grid layout */}
                <div className="flex-1 px-3 sm:px-6 pb-4 grid grid-cols-1 xl:grid-cols-2 gap-3 xl:gap-4 min-h-0 items-start">
                    {/* Daily Trend Chart - First */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
                        <div className="p-3 sm:p-4 border-b border-gray-100">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                                <div>
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Thống kê chỉ số trong tháng
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-gray-500">
                                            Dữ liệu 3 chỉ số (UV, PM2.5, PM1.0) của trạm {selectedStation?.name || 'được chọn'} theo ngày
                                        </p>

                                        {/* Legend moved to header */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">UV Index</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">PM1.0</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">PM2.5</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Remove station selector dropdown */}
                                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-3 sm:p-4">
                            <div className="w-full h-64 xl:h-80 overflow-hidden">
                                {chartData && <Line data={chartData} options={dailyChartOptions} />}
                            </div>
                        </div>
                    </div>

                    {/* Yearly Statistics Chart - Second */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col min-h-0">
                        <div className="p-3 sm:p-4 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                                        Thống kê chỉ số trong năm
                                    </h2>
                                    <div className="flex items-center gap-3 mt-1">
                                        <p className="text-xs text-gray-500">
                                            Dữ liệu 3 chỉ số (UV, PM2.5, PM1.0) của trạm {selectedStation?.name || 'được chọn'} theo từng tháng
                                        </p>

                                        {/* Legend moved to header */}
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">UV Index</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">PM1.0</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                                <span className="text-xs text-gray-600 font-medium">PM2.5</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                                    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div className="p-3 sm:p-4">
                            <div className="w-full h-64 xl:h-80 overflow-hidden">
                                {yearlyChartData && <Bar data={yearlyChartData} options={yearlyChartOptions} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Statistics; 