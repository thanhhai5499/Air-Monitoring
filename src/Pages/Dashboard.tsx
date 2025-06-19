import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MapComponent from '../components/MapComponent';
import StationSelector from '../components/StationSelector';
import { mockStations } from '../data/mockStations';
import type { StationData } from '../types/station';

interface DashboardProps {
    stationData?: StationData;
    stationId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ stationData: propStationData, stationId }) => {
    const [currentStation, setCurrentStation] = useState<StationData | null>(null);
    const [stations, setStations] = useState<StationData[]>(mockStations);

    // Không cần fetchStations nữa, dùng mockStations luôn
    // ... giữ nguyên các logic còn lại ...

    const fetchStationData = async () => {
        // Mock function for future API integration
        console.log('Fetching station data...');
    };

    useEffect(() => {
        fetchStationData();
    }, [stationId]);

    const handleStationChange = (station: StationData) => {
        setCurrentStation(station);
    };

    // Calculate average values from all stations
    const calculateAverages = () => {
        if (stations.length === 0) return { uv: 0, pm25: 0, pm1_0: 0 };

        const totals = stations.reduce((acc, station) => ({
            uv: acc.uv + (station.airQuality.uv || 0),
            pm25: acc.pm25 + (station.airQuality.pm25 || 0),
            pm1_0: acc.pm1_0 + (station.airQuality.pm1_0 || 0),
        }), { uv: 0, pm25: 0, pm1_0: 0 });

        return {
            uv: totals.uv / stations.length,
            pm25: totals.pm25 / stations.length,
            pm1_0: totals.pm1_0 / stations.length,
        };
    };

    const averages = calculateAverages();

    return (
        <Layout>
            <div className="container mx-auto px-5 py-5">
                {/* Average Air Quality Cards */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Chỉ Số Không Khí</h2>
                    <p className="text-gray-600">Dữ liệu trung bình từ {stations.length} trạm quan trắc</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {/* UV Index Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">UV</h3>
                                <p className="text-xs text-gray-500 mb-2">UV Index</p>
                                <div className="flex items-end space-x-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        {stations.length > 0 ? averages.uv.toFixed(1) : '--'}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-1">Trung bình</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Thấp</span>
                                <span>Cao</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${
                                        averages.uv >= 8 ? 'bg-red-500' :
                                        averages.uv >= 6 ? 'bg-yellow-500' :
                                        'bg-blue-500'
                                    }`}
                                    style={{ width: `${stations.length > 0 ? Math.min(averages.uv / 11 * 100, 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* PM1.0 Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">PM1.0</h3>
                                <p className="text-xs text-gray-500 mb-2">PM1.0</p>
                                <div className="flex items-end space-x-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        {stations.length > 0 ? `${averages.pm1_0.toFixed(1)} μg/m³` : '-- μg/m³'}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-1">Trung bình</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-green-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="5" cy="5" r="2" />
                                    <circle cx="12" cy="3" r="1.5" />
                                    <circle cx="19" cy="6" r="2" />
                                    <circle cx="3" cy="12" r="1.5" />
                                    <circle cx="9" cy="9" r="2" />
                                    <circle cx="16" cy="11" r="1.5" />
                                    <circle cx="7" cy="16" r="1.5" />
                                    <circle cx="14" cy="19" r="2" />
                                    <circle cx="21" cy="15" r="1.5" />
                                    <circle cx="11" cy="17" r="1" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Tốt</span>
                                <span>Có hại</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${
                                        averages.pm1_0 >= 50 ? 'bg-red-500' :
                                        averages.pm1_0 >= 25 ? 'bg-yellow-500' :
                                        'bg-green-500'
                                    }`}
                                    style={{ width: `${stations.length > 0 ? Math.min(averages.pm1_0 / 100 * 100, 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* PM2.5 Card */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="text-base font-bold text-gray-900 mb-1">PM2.5</h3>
                                <p className="text-xs text-gray-500 mb-2">PM2.5</p>
                                <div className="flex items-end space-x-2">
                                    <span className="text-xl font-bold text-gray-900">
                                        {stations.length > 0 ? `${averages.pm25.toFixed(1)} μg/m³` : '-- μg/m³'}
                                    </span>
                                    <span className="text-xs text-gray-500 mb-1">Trung bình</span>
                                </div>
                            </div>
                            <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                                <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
                                    <circle cx="6" cy="6" r="1.5" />
                                    <circle cx="12" cy="4" r="1" />
                                    <circle cx="18" cy="7" r="1.5" />
                                    <circle cx="4" cy="12" r="1" />
                                    <circle cx="10" cy="10" r="1.5" />
                                    <circle cx="16" cy="12" r="1" />
                                    <circle cx="8" cy="16" r="1" />
                                    <circle cx="14" cy="18" r="1.5" />
                                    <circle cx="20" cy="16" r="1" />
                                </svg>
                            </div>
                        </div>
                        <div className="mt-3">
                            <div className="flex justify-between text-xs text-gray-500 mb-1">
                                <span>Tốt</span>
                                <span>Có hại</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${
                                        averages.pm25 >= 35 ? 'bg-red-500' :
                                        averages.pm25 >= 15 ? 'bg-yellow-500' :
                                        'bg-orange-500'
                                    }`}
                                    style={{ width: `${stations.length > 0 ? Math.min(averages.pm25 / 55 * 100, 100) : 0}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map and Station Selector */}
                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Station Selector and Details */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Station Selector */}
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                            <div className="p-4">
                                <StationSelector
                                    stations={stations}
                                    selectedStation={currentStation}
                                    onStationChange={handleStationChange}
                                />
                            </div>
                        </div>

                        {/* Selected Station Air Quality Details */}
                        {currentStation && (
                            <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-fit">
                                <div className="p-3 border-b border-gray-200">
                                    <h3 className="text-base font-semibold text-gray-900">Thông số chi tiết</h3>
                                    <p className="text-sm text-gray-600 mt-1">{currentStation.name}</p>
                                </div>
                                <div className="p-3 space-y-2.5">
                                    {/* UV Index Card - Compact */}
                                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-md p-2.5 border-l-3 border-l-blue-500">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900">UV Index</h4>
                                                    <div className="flex items-center space-x-1.5">
                                                        <span className="text-base font-bold text-gray-900">
                                                            {currentStation.airQuality.uv?.toFixed(1) || '-'}
                                                        </span>
                                                        <div className="flex items-center space-x-0.5">
                                                            <svg className={`w-2.5 h-2.5 ${currentStation.airQuality.uvTrend && currentStation.airQuality.uvTrend > 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentStation.airQuality.uvTrend && currentStation.airQuality.uvTrend > 0 ? "M17 7l-9.2 9.2M7 7v10M7 7h10" : "M7 17l9.2-9.2M17 17V7M17 17H7"} />
                                                            </svg>
                                                            <span className={`text-xs ${currentStation.airQuality.uvTrend && currentStation.airQuality.uvTrend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {currentStation.airQuality.uvTrend ? `${Math.abs(currentStation.airQuality.uvTrend).toFixed(1)}%` : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${
                                                            (currentStation.airQuality.uv || 0) >= 8 ? 'bg-red-500' :
                                                            (currentStation.airQuality.uv || 0) >= 6 ? 'bg-yellow-500' :
                                                            'bg-blue-500'
                                                        }`}
                                                        style={{ width: `${Math.min((currentStation.airQuality.uv || 0) / 11 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PM1.0 Card - Compact */}
                                    <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-md p-2.5 border-l-3 border-l-green-500">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="5" cy="5" r="2" />
                                                    <circle cx="12" cy="3" r="1.5" />
                                                    <circle cx="19" cy="6" r="2" />
                                                    <circle cx="3" cy="12" r="1.5" />
                                                    <circle cx="9" cy="9" r="2" />
                                                    <circle cx="16" cy="11" r="1.5" />
                                                    <circle cx="7" cy="16" r="1.5" />
                                                    <circle cx="14" cy="19" r="2" />
                                                    <circle cx="21" cy="15" r="1.5" />
                                                    <circle cx="11" cy="17" r="1" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900">PM1.0</h4>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-base font-bold text-gray-900">
                                                            {currentStation.airQuality.pm1_0?.toFixed(1) || '-'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">μg/m³</span>
                                                        <div className="flex items-center space-x-0.5">
                                                            <svg className={`w-2.5 h-2.5 ${currentStation.airQuality.pm1_0Trend && currentStation.airQuality.pm1_0Trend > 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentStation.airQuality.pm1_0Trend && currentStation.airQuality.pm1_0Trend > 0 ? "M17 7l-9.2 9.2M7 7v10M7 7h10" : "M7 17l9.2-9.2M17 17V7M17 17H7"} />
                                                            </svg>
                                                            <span className={`text-xs ${currentStation.airQuality.pm1_0Trend && currentStation.airQuality.pm1_0Trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {currentStation.airQuality.pm1_0Trend ? `${Math.abs(currentStation.airQuality.pm1_0Trend).toFixed(1)}%` : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${
                                                            (currentStation.airQuality.pm1_0 || 0) >= 50 ? 'bg-red-500' :
                                                            (currentStation.airQuality.pm1_0 || 0) >= 25 ? 'bg-yellow-500' :
                                                            'bg-green-500'
                                                        }`}
                                                        style={{ width: `${Math.min((currentStation.airQuality.pm1_0 || 0) / 100 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* PM2.5 Card - Compact */}
                                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-md p-2.5 border-l-3 border-l-orange-500">
                                        <div className="flex items-center space-x-2.5">
                                            <div className="w-7 h-7 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                    <circle cx="6" cy="6" r="1.5" />
                                                    <circle cx="12" cy="4" r="1" />
                                                    <circle cx="18" cy="7" r="1.5" />
                                                    <circle cx="4" cy="12" r="1" />
                                                    <circle cx="10" cy="10" r="1.5" />
                                                    <circle cx="16" cy="12" r="1" />
                                                    <circle cx="8" cy="16" r="1" />
                                                    <circle cx="14" cy="18" r="1.5" />
                                                    <circle cx="20" cy="16" r="1" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900">PM2.5</h4>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-base font-bold text-gray-900">
                                                            {currentStation.airQuality.pm25?.toFixed(1) || '-'}
                                                        </span>
                                                        <span className="text-xs text-gray-500">μg/m³</span>
                                                        <div className="flex items-center space-x-0.5">
                                                            <svg className={`w-2.5 h-2.5 ${currentStation.airQuality.pm25Trend && currentStation.airQuality.pm25Trend > 0 ? 'text-red-500' : 'text-green-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={currentStation.airQuality.pm25Trend && currentStation.airQuality.pm25Trend > 0 ? "M17 7l-9.2 9.2M7 7v10M7 7h10" : "M7 17l9.2-9.2M17 17V7M17 17H7"} />
                                                            </svg>
                                                            <span className={`text-xs ${currentStation.airQuality.pm25Trend && currentStation.airQuality.pm25Trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                                                {currentStation.airQuality.pm25Trend ? `${Math.abs(currentStation.airQuality.pm25Trend).toFixed(1)}%` : '-'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${
                                                            (currentStation.airQuality.pm25 || 0) >= 35 ? 'bg-red-500' :
                                                            (currentStation.airQuality.pm25 || 0) >= 15 ? 'bg-yellow-500' :
                                                            'bg-orange-500'
                                                        }`}
                                                        style={{ width: `${Math.min((currentStation.airQuality.pm25 || 0) / 55 * 100, 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Pin Card */}
                                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-md p-2.5 border-l-3 border-l-gray-400">
                                        <div className="flex items-center space-x-2.5">
                                            <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                (currentStation.battery || 0) >= 60 ? 'bg-green-500' :
                                                (currentStation.battery || 0) >= 30 ? 'bg-orange-500' :
                                                'bg-red-500'
                                            }`}>
                                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <rect x="3" y="7" width="15" height="10" rx="2" strokeWidth="2" />
                                                    <rect x="18" y="10" width="2" height="4" rx="1" strokeWidth="2" />
                                                    <rect x="5" y="9" width="11" height="6" rx="1" fill="white" />
                                                </svg>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between mb-1">
                                                    <h4 className="text-sm font-medium text-gray-900">Pin</h4>
                                                    <span className="text-base font-bold text-gray-900">
                                                        {currentStation.battery !== undefined ? `${currentStation.battery}%` : '--'}
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${
                                                            (currentStation.battery || 0) >= 60 ? 'bg-green-500' :
                                                            (currentStation.battery || 0) >= 30 ? 'bg-orange-500' :
                                                            'bg-red-500'
                                                        }`}
                                                        style={{ width: `${Math.min((currentStation.battery || 0), 100)}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Map */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                            <div className="mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Vị trí trạm</h3>
                                <p className="text-sm text-gray-600 mt-1">
                                    {currentStation ? currentStation.name : 'Chọn trạm để hiển thị'}
                                </p>
                            </div>
                            <MapComponent
                                stationData={currentStation}
                                height="400px"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default Dashboard; 