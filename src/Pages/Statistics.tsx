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

// Empty data structure for yearly statistics - ready for API integration
const yearlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
        {
            label: 'UV Index',
            data: Array(12).fill(0),
            backgroundColor: '#3B82F6',
            borderRadius: 4,
        },
        {
            label: 'PM1.0',
            data: Array(12).fill(0),
            backgroundColor: '#10B981',
            borderRadius: 4,
        },
        {
            label: 'PM2.5',
            data: Array(12).fill(0),
            backgroundColor: '#F59E0B',
            borderRadius: 4,
        },
    ],
};

// Sample data for daily trends with realistic values
const dailyTrendData = {
    Tram1: {
        labels: Array.from({ length: 31 }, (_, i) => i + 1),
        datasets: [
            {
                label: 'UV Index',
                data: [8.2, 7.8, 7.5, 6.8, 8.1, 9.2, 8.7, 7.9, 8.5, 9.1, 8.8, 8.3, 7.6, 8.9, 9.3, 8.1, 7.7, 8.4, 8.8, 8.2, 7.9, 8.6, 9.0, 8.5, 8.3, 8.7, 8.1, 7.8, 8.4, 8.9, 8.6],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM1.0',
                data: [55.3, 42.1, 41.8, 58.7, 44.2, 53.8, 48.1, 47.3, 56.8, 40.2, 58.1, 46.7, 45.9, 54.2, 57.8, 48.4, 43.6, 51.2, 55.9, 47.1, 49.8, 44.7, 42.3, 50.6, 56.4, 48.9, 45.2, 52.8, 58.2, 49.7, 46.1],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM2.5',
                data: [32.1, 28.5, 18.3, 18.7, 24.2, 25.8, 22.1, 24.7, 26.3, 23.9, 31.2, 30.8, 26.4, 28.1, 34.2, 27.8, 26.5, 29.3, 32.7, 28.9, 30.1, 27.4, 25.8, 29.7, 31.5, 28.2, 26.9, 30.4, 32.8, 29.6, 27.3],
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    },
    Tram2: {
        labels: Array.from({ length: 31 }, (_, i) => i + 1),
        datasets: [
            {
                label: 'UV Index',
                data: [7.8, 7.4, 7.1, 6.5, 7.7, 8.8, 8.3, 7.5, 8.1, 8.7, 8.4, 7.9, 7.2, 8.5, 8.9, 7.7, 7.3, 8.0, 8.4, 7.8, 7.5, 8.2, 8.6, 8.1, 7.9, 8.3, 7.7, 7.4, 8.0, 8.5, 8.2],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM1.0',
                data: [51.9, 38.7, 38.4, 54.3, 40.8, 49.4, 44.7, 43.9, 52.4, 36.8, 53.7, 43.3, 42.5, 50.8, 53.4, 44.0, 40.2, 47.8, 51.5, 43.7, 46.4, 41.3, 38.9, 47.2, 52.0, 45.5, 41.8, 48.4, 53.8, 46.3, 42.7],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM2.5',
                data: [29.8, 25.2, 15.9, 16.3, 21.8, 23.4, 19.7, 22.3, 24.9, 21.5, 28.8, 27.4, 23.0, 24.7, 30.8, 24.4, 23.1, 25.9, 29.3, 25.5, 26.7, 24.0, 22.4, 26.3, 28.1, 24.8, 23.5, 26.0, 29.4, 26.2, 23.9],
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    },
    Tram3: {
        labels: Array.from({ length: 31 }, (_, i) => i + 1),
        datasets: [
            {
                label: 'UV Index',
                data: [8.6, 8.2, 7.9, 7.2, 8.5, 9.6, 9.1, 8.3, 8.9, 9.5, 9.2, 8.7, 8.0, 9.3, 9.7, 8.5, 8.1, 8.8, 9.2, 8.6, 8.3, 9.0, 9.4, 8.9, 8.7, 9.1, 8.5, 8.2, 8.8, 9.3, 9.0],
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM1.0',
                data: [58.7, 45.5, 45.2, 62.1, 47.6, 57.2, 51.5, 50.7, 60.2, 43.6, 61.5, 50.1, 49.3, 57.6, 61.2, 51.8, 47.0, 54.6, 59.3, 50.5, 53.2, 48.1, 45.7, 54.0, 59.8, 52.3, 48.6, 56.2, 61.6, 53.1, 49.5],
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
            {
                label: 'PM2.5',
                data: [34.4, 31.8, 20.7, 21.1, 26.6, 28.2, 24.5, 27.1, 28.7, 26.3, 33.6, 33.2, 28.8, 30.5, 36.6, 31.2, 29.9, 32.7, 36.1, 32.3, 33.5, 30.8, 29.2, 33.1, 34.9, 31.6, 30.3, 33.8, 36.2, 32.0, 30.7],
                borderColor: '#F59E0B',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
            },
        ],
    },
};

const Statistics: React.FC = () => {
    // Calculate average data from all stations
    const calculateAverageData = () => {
        const stations = Object.values(dailyTrendData);
        const labels = dailyTrendData.Tram1.labels;

        const averageDatasets = dailyTrendData.Tram1.datasets.map((_, datasetIndex) => {
            const averageData = labels.map((_, dayIndex) => {
                const sum = stations.reduce((acc, station) => {
                    return acc + station.datasets[datasetIndex].data[dayIndex];
                }, 0);
                return Number((sum / stations.length).toFixed(1));
            });

            return {
                ...dailyTrendData.Tram1.datasets[datasetIndex],
                data: averageData
            };
        });

        return {
            labels,
            datasets: averageDatasets
        };
    };

    const averageChartData = calculateAverageData();

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
                <div className="px-3 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 flex-shrink-0">
                    <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">Thống kê chất lượng không khí</h1>
                    <p className="text-gray-600 text-sm">Dữ liệu chi tiết về các chỉ số môi trường</p>
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
                                            Dữ liệu trung bình 3 chỉ số (UV, PM2.5, PM1.0) từ tất cả các trạm theo ngày
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
                                <Line data={averageChartData} options={dailyChartOptions} />
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
                                            Dữ liệu trung bình 3 chỉ số (UV, PM2.5, PM1.0) từ tất cả các trạm theo từng tháng
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
                                <Bar data={yearlyData} options={yearlyChartOptions} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Statistics; 