import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import MapComponent from '../components/MapComponent';
import StationSelector from '../components/StationSelector';
import { fetchAverageDayData, fetchSensorLatestData } from '../services/dataApi';
import { toast } from 'react-toastify';
import { authService } from '../services/authService';
import type { StationData } from '../types/station';

interface DashboardProps {
    stationData?: StationData;
    stationId?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ stationData: propStationData, stationId }) => {
    const [currentStation, setCurrentStation] = useState<StationData | null>(null);
    const [stations, setStations] = useState<StationData[]>([]);
    const [averageData, setAverageData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let stationToSelect: StationData | undefined;

        if (stationId) {
            stationToSelect = stations.find(s => s.id === stationId);
        }

        // If no specific station is found, or if no ID was provided, default to the first station.
        if (!stationToSelect && stations.length > 0) {
            stationToSelect = stations[0];
        }

        setCurrentStation(stationToSelect || null);
    }, [stationId, stations]);

    useEffect(() => {
        Promise.all([
            fetchAverageDayData(),
            fetchSensorLatestData()
        ])
            .then(([averageDay, stations]) => {
                setAverageData(averageDay || []);
                setStations(stations.map(mapStationFromApi));
            })
            .catch((err) => {
                console.error('Lỗi khi tải dữ liệu:', err);
            });
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [averageDay, stations] = await Promise.all([
                fetchAverageDayData(),
                fetchSensorLatestData()
            ]);
            setAverageData(averageDay.data || []);
            setStations(stations || []);
        } catch (error) {
            toast.error('Lỗi khi tải dữ liệu!');
        } finally {
            setLoading(false);
        }
    };

    const handleStationChange = (station: StationData) => {
        setCurrentStation(station);
    };

    // Helper lấy giá trị theo sensor
    const getSensor = (key: string) => averageData.find(d => d.sensor.toLowerCase() === key.toLowerCase());

    // Hàm tính chỉ số UV (cường độ * 1.6)
    const calculateUVIndex = (uvIntensity: number | null | undefined): number | null => {
        if (uvIntensity === null || uvIntensity === undefined) return null;
        return Math.round(uvIntensity * 1.6); // Làm tròn thành số nguyên
    };

    // Hàm lấy mô tả chỉ số UV
    const getUVIndexDescription = (uvIndex: number | null): string => {
        if (uvIndex === null) return '';
        if (uvIndex <= 2) return 'Thấp';
        if (uvIndex <= 5) return 'Trung bình';
        if (uvIndex <= 7) return 'Cao';
        if (uvIndex <= 10) return 'Rất cao';
        return 'Cực cao';
    };

    // Hàm lấy màu thanh theo level
    const getBarColor = (level: number) => {
        switch (level) {
            case 1: return 'bg-green-500';   // #4CAF50
            case 2: return 'bg-yellow-400';  // #FFD600
            case 3: return 'bg-orange-400';  // #FF9800
            case 4: return 'bg-red-500';     // #F44336
            default: return 'bg-gray-300';
        }
    };

    // Hàm lấy độ dài thanh theo level
    const getBarWidthByLevel = (level: number) => {
        switch (level) {
            case 1: return '25%';
            case 2: return '50%';
            case 3: return '75%';
            case 4: return '100%';
            default: return '0%';
        }
    };

    // Thêm 2 hàm hỗ trợ cho battery (nhận giá trị đã convert)
    function getBatteryBarColor(convertedValue: number | null | undefined) {
        const voltage = convertedValue ? convertedValue / 1000 : 0;
        if (voltage >= 4.1) return 'bg-green-500';    // 90-100%
        if (voltage >= 3.8) return 'bg-yellow-400';   // 65-90%
        if (voltage >= 3.5) return 'bg-orange-400';   // 35-65%
        return 'bg-red-500';                          // <35%
    }
    function getBatteryBarWidth(convertedValue: number | null | undefined) {
        const voltage = convertedValue ? convertedValue / 1000 : 0;
        if (voltage > 4.5) return '100%';         // Quá sạc
        if (voltage >= 4.2) return '100%';        // 100%
        if (voltage >= 4.1) return '96%';         // 95-98%
        if (voltage >= 4.0) return '92%';         // 90-95%
        if (voltage >= 3.9) return '87%';         // 85-90%
        if (voltage >= 3.8) return '80%';         // 75-85%
        if (voltage >= 3.7) return '70%';         // 65-75%
        if (voltage >= 3.6) return '57%';         // 50-65%
        if (voltage >= 3.5) return '42%';         // 35-50%
        if (voltage >= 3.4) return '27%';         // 20-35%
        if (voltage >= 3.3) return '17%';         // 15-20%
        if (voltage >= 3.0) return '10%';         // 5-15%
        if (voltage >= 2.5) return '3%';          // 0.2-5%
        if (voltage >= 2.2) return '1%';          // 0%
        return '0%';                              // Pin quá xả
    }

    // Map dữ liệu từ API về dạng FE cần (không fix cứng sensor)
    function mapStationFromApi(apiStation: any): StationData {
        let status: 'online' | 'offline' | 'maintenance' = 'offline';
        if (apiStation.status === 'active') status = 'online';
        else if (apiStation.status === 'maintenance') status = 'maintenance';

        return {
            id: apiStation.id.toString(),
            name: apiStation.name,
            location: apiStation.location,
            coordinates: { lat: apiStation.latitude, lng: apiStation.longitude },
            sensors: apiStation.sensors || [],
            status,
            lastUpdated: apiStation.sensors?.[0]?.recordedAt || '',
        };
    }

    // Hàm chuyển đổi giá trị battery theo từng trạm
    function convertBatteryValue(stationName: string, value: number): number {
        if (stationName === '[CNC]Sensor_A') {
            return 3962 + ((4195 - 3962) / (3840 - 3250)) * (value - 3250);
        }
        if (stationName === '[CNC]Sensor_B') {
            return 3962 + ((4195 - 3962) / (3840 - 3250)) * (value - 3250);
        }
        if (stationName === '[CNC]Sensor_C') {
            return 3962 + ((4195 - 3962) / (3840 - 3250)) * (value - 3250);
        }
        return value;
    }

    return (
        <Layout>
            <div className="container mx-auto px-5 py-5">
                {/* Average Air Quality Cards */}
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-gray-900 mb-1">Chỉ Số Không Khí</h2>
                    <p className="text-gray-600">Dữ liệu trung bình từ 3 trạm quan trắc</p>
                </div>
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    {averageData.filter(item => item.sensor.toLowerCase() !== 'battery').map((item) => {
                        const isUV = item.sensor.toLowerCase() === 'uv';
                        const uvIndex = isUV ? calculateUVIndex(item.avg) : null;

                        return (
                            <div key={item.sensor} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 relative">
                                {/* Chỉ số UV ở góc phải */}
                                {isUV && uvIndex !== null && (
                                    <div className="absolute top-3 right-3 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                                        Chỉ số UV: {uvIndex}
                                    </div>
                                )}
                                <div className="flex items-start justify-between">
                                    <div className={isUV ? 'pr-20' : ''}>
                                        <h3 className="text-base font-bold text-gray-900 mb-1">{item.sensor}</h3>
                                        <p className="text-xs text-gray-500 mb-2">{item.name}</p>
                                        <div className="flex items-end space-x-2">
                                            <span className="text-xl font-bold text-gray-900">
                                                {item.avg !== undefined ? `${item.avg.toFixed(1)} ${item.unit}` : '--'}
                                            </span>
                                            <span className="text-xs text-gray-500 mb-1">{item.description || 'Trung bình'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                                        <span>Tốt</span>
                                        <span className="mx-auto text-xs text-gray-500">Trung Bình</span>
                                        <span>Có hại</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-1.5 relative">
                                        <div
                                            className={`h-1.5 rounded-full ${getBarColor(item.level ?? 0)} absolute left-0 top-0`}
                                            style={{ width: getBarWidthByLevel(item.level ?? 0), zIndex: 1 }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
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
                                    {(() => {
                                        const user = authService.getAuthState().user;
                                        const canViewBattery = user && (
                                            user.role === '1' || user.role === '2' ||
                                            user.role === 'admin' || user.role === 'manager'
                                        );
                                        return currentStation.sensors
                                            .filter(sensor => {
                                                if (sensor.name.toLowerCase() === 'battery') {
                                                    return canViewBattery;
                                                }
                                                // Nếu là user thường thì ẩn battery
                                                if (user && user.role === 'user' && sensor.name.toLowerCase() === 'battery') {
                                                    return false;
                                                }
                                                return true;
                                            })
                                            .map(sensor => {
                                                let valueDisplay = '';
                                                let uvIndexDisplay = '';
                                                let convertedBatteryValue: number | undefined;

                                                if (sensor.name.toLowerCase() === 'battery' && sensor.value !== null && sensor.value !== undefined) {
                                                    convertedBatteryValue = convertBatteryValue(currentStation.name, sensor.value);
                                                    const voltage = convertedBatteryValue / 1000;
                                                    let percent = '';
                                                    if (voltage >= 4.2 && voltage <= 4.5) percent = '100%';
                                                    else if (voltage > 4.5) percent = '>100% (quá sạc)';
                                                    else if (voltage >= 4.1) percent = '95-98%';
                                                    else if (voltage >= 4.0) percent = '90-95%';
                                                    else if (voltage >= 3.9) percent = '85-90%';
                                                    else if (voltage >= 3.8) percent = '75-85%';
                                                    else if (voltage >= 3.7) percent = '65-75%';
                                                    else if (voltage >= 3.6) percent = '50-65%';
                                                    else if (voltage >= 3.5) percent = '35-50%';
                                                    else if (voltage >= 3.4) percent = '20-35%';
                                                    else if (voltage >= 3.3) percent = '15-20%';
                                                    else if (voltage >= 3.2) percent = '10-15%';
                                                    else if (voltage >= 3.1) percent = '7-10%';
                                                    else if (voltage >= 3.0) percent = '5-7%';
                                                    else if (voltage >= 2.9) percent = '3-5%';
                                                    else if (voltage >= 2.8) percent = '2-3%';
                                                    else if (voltage >= 2.7) percent = '1-2%';
                                                    else if (voltage >= 2.6) percent = '0.5-1%';
                                                    else if (voltage >= 2.5) percent = '0.2-0.5%';
                                                    else if (voltage >= 2.4) percent = '0.1-0.2%';
                                                    else if (voltage >= 2.3) percent = '0.05-0.1%';
                                                    else if (voltage >= 2.2) percent = '0%';
                                                    else if (voltage > 2.0 && voltage < 2.2) percent = 'Pin quá xả';
                                                    else if (voltage <= 2.0) percent = 'Pin quá xả';
                                                    valueDisplay = `${percent} - ${voltage.toFixed(2)} V`;
                                                } else if (sensor.name.toLowerCase() === 'uv' && sensor.value !== null && sensor.value !== undefined) {
                                                    const uvIndex = calculateUVIndex(sensor.value);
                                                    const uvIndexDesc = getUVIndexDescription(uvIndex);
                                                    valueDisplay = `${sensor.value} ${sensor.unit}`;
                                                    uvIndexDisplay = uvIndex !== null ? `Chỉ số UV: ${uvIndex} (${uvIndexDesc})` : '';
                                                } else {
                                                    valueDisplay = sensor.value !== null && sensor.value !== undefined ? `${sensor.value} ${sensor.unit}` : '--';
                                                }
                                                return (
                                                    <div key={sensor.id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-md p-2.5 border-l-3 border-l-gray-400">
                                                        <div className="flex items-center space-x-2.5">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <h4 className="text-sm font-medium text-gray-900">{sensor.name}</h4>
                                                                    <span className="text-base font-bold text-gray-900">
                                                                        {valueDisplay}
                                                                    </span>
                                                                </div>
                                                                {/* Hiển thị chỉ số UV */}
                                                                {uvIndexDisplay && (
                                                                    <p className="text-xs text-blue-600 font-medium mb-1">{uvIndexDisplay}</p>
                                                                )}
                                                                {sensor.name.toLowerCase() === 'battery' ? (
                                                                    <>
                                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                            <span>Yếu</span>
                                                                            <span className="mx-auto text-xs text-gray-500">Trung Bình</span>
                                                                            <span>Tốt</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                                            <div
                                                                                className={`h-1.5 rounded-full ${getBatteryBarColor(convertedBatteryValue)}`}
                                                                                style={{ width: getBatteryBarWidth(convertedBatteryValue) }}
                                                                            ></div>
                                                                        </div>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                                            <span>Tốt</span>
                                                                            <span className="mx-auto text-xs text-gray-500">Trung Bình</span>
                                                                            <span>Có hại</span>
                                                                        </div>
                                                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1.5">
                                                                            <div
                                                                                className={`h-1.5 rounded-full ${getBarColor(sensor.level ?? 0)}`}
                                                                                style={{ width: getBarWidthByLevel(sensor.level ?? 0) }}
                                                                            ></div>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            });
                                    })()}
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