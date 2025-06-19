import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface StationData {
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
}

interface MapComponentProps {
    stationData: StationData | null;
    height?: string;
}

// Tạo custom icon cho trạm với 3 thông số xung quanh
const createStationIcon = (stationData: StationData) => {
    const { status, airQuality } = stationData;
    const statusColor = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#f59e0b';

    // Helper function để lấy màu cho từng thông số
    const getParameterColor = (value: number | null, type: 'uv' | 'pm25' | 'pm1_0'): string => {
        if (value === null) return '#6b7280';

        switch (type) {
            case 'uv':
                if (value <= 2) return '#10b981';
                if (value <= 5) return '#f59e0b';
                if (value <= 7) return '#f97316';
                return '#ef4444';
            case 'pm25':
                if (value <= 12) return '#10b981';
                if (value <= 35) return '#f59e0b';
                if (value <= 55) return '#f97316';
                return '#ef4444';
            case 'pm1_0':
                if (value <= 20) return '#10b981';
                if (value <= 50) return '#f59e0b';
                if (value <= 100) return '#f97316';
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return L.divIcon({
        html: `
            <div style="
                position: relative;
                width: 160px;
                height: 160px;
                display: flex;
                align-items: center;
                justify-content: center;
            ">
                <!-- UV Index - Top -->
                <div style="
                    position: absolute;
                    top: 10px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: ${getParameterColor(airQuality.uv, 'uv')};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    min-width: 50px;
                ">
                    <div style="font-size: 8px; opacity: 0.9;">UV</div>
                    <div>${airQuality.uv?.toFixed(1) || '-'}</div>
                </div>

                <!-- PM2.5 - Bottom Left -->
                <div style="
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    background-color: ${getParameterColor(airQuality.pm25, 'pm25')};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    min-width: 50px;
                ">
                    <div style="font-size: 8px; opacity: 0.9;">PM2.5</div>
                    <div>${airQuality.pm25?.toFixed(1) || '-'}</div>
                </div>

                <!-- PM1.0 - Bottom Right -->
                <div style="
                    position: absolute;
                    bottom: 10px;
                    right: 10px;
                    background-color: ${getParameterColor(airQuality.pm1_0, 'pm1_0')};
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-family: 'Outfit', sans-serif;
                    font-size: 10px;
                    font-weight: 600;
                    text-align: center;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    min-width: 50px;
                ">
                    <div style="font-size: 8px; opacity: 0.9;">PM1.0</div>
                    <div>${airQuality.pm1_0?.toFixed(1) || '-'}</div>
                </div>

                <!-- Center Station Icon -->
                <div style="
                    background: linear-gradient(135deg, ${statusColor} 0%, ${statusColor}aa 100%);
                    width: 50px;
                    height: 50px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    position: relative;
                ">
                    <!-- Station Tower Icon -->
                    <svg width="24" height="24" fill="white" viewBox="0 0 24 24">
                        <path d="M12 2C8.14 2 5 5.14 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.86-3.14-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                        <!-- Antenna lines -->
                        <path d="M8 9c0-2.21 1.79-4 4-4s4 1.79 4 4M6 9c0-3.31 2.69-6 6-6s6 2.69 6 6" stroke="white" stroke-width="1" fill="none"/>
                    </svg>
                    
                    <!-- Status indicator -->
                    <div style="
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        width: 12px;
                        height: 12px;
                        background-color: ${statusColor};
                        border: 2px solid white;
                        border-radius: 50%;
                        animation: ${status === 'online' ? 'pulse 2s infinite' : 'none'};
                    "></div>
                </div>

                <!-- Connection lines -->
                <svg style="
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    pointer-events: none;
                    z-index: -1;
                " viewBox="0 0 160 160">
                    <!-- Line to UV -->
                    <line x1="80" y1="80" x2="80" y2="35" stroke="${statusColor}" stroke-width="2" opacity="0.3" stroke-dasharray="5,5"/>
                    <!-- Line to PM2.5 -->
                    <line x1="80" y1="80" x2="35" y2="125" stroke="${statusColor}" stroke-width="2" opacity="0.3" stroke-dasharray="5,5"/>
                    <!-- Line to PM1.0 -->
                    <line x1="80" y1="80" x2="125" y2="125" stroke="${statusColor}" stroke-width="2" opacity="0.3" stroke-dasharray="5,5"/>
                </svg>
            </div>

            <style>
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            </style>
        `,
        className: 'custom-station-marker-advanced',
        iconSize: [160, 160],
        iconAnchor: [80, 80],
        popupAnchor: [0, -80]
    });
};

// Helper function để xác định màu dựa trên giá trị chất lượng không khí
const getAirQualityColor = (value: number | null, type: 'uv' | 'pm25' | 'pm1_0'): string => {
    if (value === null) return '#gray';

    switch (type) {
        case 'uv':
            if (value <= 2) return '#10b981'; // green
            if (value <= 5) return '#f59e0b'; // yellow
            if (value <= 7) return '#f97316'; // orange
            return '#ef4444'; // red
        case 'pm25':
            if (value <= 12) return '#10b981'; // green
            if (value <= 35) return '#f59e0b'; // yellow
            if (value <= 55) return '#f97316'; // orange
            return '#ef4444'; // red
        case 'pm1_0':
            if (value <= 20) return '#10b981'; // green
            if (value <= 50) return '#f59e0b'; // yellow
            if (value <= 100) return '#f97316'; // orange
            return '#ef4444'; // red
        default:
            return '#6b7280';
    }
};

// Component để hiển thị trend arrow
const TrendArrow: React.FC<{ trend: number | undefined }> = ({ trend }) => {
    if (!trend) return <span>-</span>;

    const isPositive = trend > 0;
    const color = isPositive ? '#ef4444' : '#10b981';
    const arrow = isPositive ? '↗' : '↘';

    return (
        <span style={{ color }}>
            {arrow} {Math.abs(trend).toFixed(1)}%
        </span>
    );
};

// Component để cập nhật center của map khi station thay đổi
const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        console.log('MapUpdater: Updating map to center:', center, 'zoom:', zoom);

        // Đảm bảo map được update với animation
        map.setView(center, zoom, {
            animate: true,
            duration: 1.0
        });

        // Thêm timeout để đảm bảo marker được hiển thị
        setTimeout(() => {
            map.invalidateSize();
        }, 100);
    }, [map, center, zoom]);

    return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ stationData, height = '384px' }) => {
    // Debug log để kiểm tra dữ liệu
    console.log('MapComponent rendering with station:', stationData);

    // Handle case when no station data
    if (!stationData) {
        return (
            <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-gray-500 font-medium">Không có dữ liệu trạm</p>
                    <p className="text-gray-400 text-sm mt-1">Chọn trạm để hiển thị bản đồ</p>
                </div>
            </div>
        );
    }

    const { coordinates, name, airQuality, status, battery } = stationData;

    return (
        <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
                center={[coordinates.lat, coordinates.lng]}
                zoom={15}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                scrollWheelZoom={true}
            >
                <MapUpdater center={[coordinates.lat, coordinates.lng]} zoom={15} />

                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                <Marker
                    position={[coordinates.lat, coordinates.lng]}
                    icon={createStationIcon(stationData)}
                >
                    <Popup>
                        <div className="p-3 min-w-[280px]">
                            <div className="mb-3">
                                <h3 className="font-semibold text-gray-900 text-sm mb-1">{name}</h3>
                                <div className="flex items-center mt-2">
                                    <span className={`inline-block w-2 h-2 rounded-full mr-2 ${status === 'online' ? 'bg-green-500' :
                                        status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                                        }`}></span>
                                    <span className="text-xs font-medium">
                                        {status === 'online' ? 'Hoạt động' :
                                            status === 'offline' ? 'Offline' : 'Bảo trì'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">UV Index:</span>
                                    <div className="flex items-center space-x-2">
                                        <span style={{ color: getAirQualityColor(airQuality.uv, 'uv') }} className="font-semibold">
                                            {airQuality.uv?.toFixed(1) || '-'}
                                        </span>
                                        <TrendArrow trend={airQuality.uvTrend} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">PM1.0:</span>
                                    <div className="flex items-center space-x-2">
                                        <span style={{ color: getAirQualityColor(airQuality.pm1_0, 'pm1_0') }} className="font-semibold">
                                            {airQuality.pm1_0?.toFixed(1) || '-'} μg/m³
                                        </span>
                                        <TrendArrow trend={airQuality.pm1_0Trend} />
                                    </div>
                                </div>

                                <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">PM2.5:</span>
                                    <div className="flex items-center space-x-2">
                                        <span style={{ color: getAirQualityColor(airQuality.pm25, 'pm25') }} className="font-semibold">
                                            {airQuality.pm25?.toFixed(1) || '-'} μg/m³
                                        </span>
                                        <TrendArrow trend={airQuality.pm25Trend} />
                                    </div>
                                </div>

                                {battery !== undefined && (
                                    <div className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-xs">
                                        <span className="font-medium">Pin:</span>
                                        <span className="font-semibold">{battery}%</span>
                                    </div>
                                )}
                            </div>

                            <div className="mt-3 pt-2 border-t border-gray-200">
                                <p className="text-xs text-gray-400">
                                    Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
                                </p>
                                <p className="text-xs text-blue-600 mt-1">
                                    Debug: Map center should be at this location
                                </p>
                            </div>
                        </div>
                    </Popup>
                </Marker>


            </MapContainer>
        </div>
    );
};

export default MapComponent; 