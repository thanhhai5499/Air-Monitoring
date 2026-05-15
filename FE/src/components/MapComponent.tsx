import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { authService } from '../services/authService';

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
    sensors: {
        id: number;
        name: string;
        value: number | null;
        unit: string;
        recordedAt: string;
        level?: number | null;
    }[];
    status: 'online' | 'offline' | 'maintenance';
    lastUpdated?: string;
}

interface MapComponentProps {
    stationData: StationData | null;
    height?: string;
}

// Helper: lấy sensor theo tên (không phân biệt hoa thường)
function getSensorByKey(sensors: StationData['sensors'], key: string) {
    return sensors.find(s => s.name.toLowerCase().includes(key.toLowerCase()));
}

// Helper: lấy màu theo level
function getColorByLevel(level?: number | null) {
    if (level === 1) return '#10b981'; // xanh
    if (level === 2) return '#FFD600'; // vàng
    if (level === 3) return '#FF9800'; // cam
    if (level === 4) return '#F44336'; // đỏ
    return '#6b7280'; // xám
}

// Helper: chuyển đổi battery value sang phần trăm và volt
function getBatteryDisplay(sensor: { value: number | null | undefined }) {
    if (sensor.value === null || sensor.value === undefined) return '--';
    const voltage = sensor.value / 1000;
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
    return `${percent} - ${voltage.toFixed(2)} V`;
}

// Tạo custom icon SVG cho trạm với tất cả chỉ số quanh marker
const createStationIcon = (stationData: StationData) => {
    const { status, sensors } = stationData;
    const statusColor = status === 'online' ? '#10b981' : status === 'offline' ? '#ef4444' : '#f59e0b';
    // Lấy role user hiện tại
    const user = authService.getAuthState().user;
    const canViewBattery = user && (
        user.role === '1' || user.role === '2' ||
        user.role === 'admin' || user.role === 'manager'
    );
    // Lọc sensors: ẩn battery nếu user là 'user' hoặc '3'
    const filteredSensors = sensors.filter(sensor => {
        if (sensor.name.toLowerCase() === 'battery') {
            return canViewBattery;
        }
        return true;
    });
    const n = filteredSensors.length;
    // Nếu mapWidth/mapHeight chưa có, dùng mặc định 140 (giống SVG cũ)
    const mapWidth = 140;
    const mapHeight = 140;
    const extra = 64;
    const svgWidth = mapWidth + extra;
    const svgHeight = mapHeight + extra;
    // Center dịch theo extra/2 để marker và bubble trùng tâm bản đồ
    const center = { x: 70 + extra / 2, y: 70 + extra / 2 };
    // Bubble size và bán kính tự động co nhỏ nếu nhiều sensor
    const baseRadius = 44;
    const minRadius = 32;
    const radius = n <= 4 ? baseRadius : Math.max(minRadius, baseRadius - (n - 4) * 4);
    const baseBubble = 48;
    const minBubble = 32;
    const bubbleSize = n <= 6 ? baseBubble : Math.max(minBubble, baseBubble - (n - 6) * 2);
    // Bubble tròn hiện đại, giá trị lớn ở giữa, tên nhỏ phía dưới, border trắng, bóng đổ nhẹ
    const circleBubbleRadius = 32;
    const sensorBubbles = filteredSensors.map((sensor, i) => {
        const angle = (2 * Math.PI * i) / n - Math.PI / 2;
        const x = center.x + (radius + 20) * Math.cos(angle);
        const y = center.y + (radius + 20) * Math.sin(angle);
        const color = getColorByLevel(sensor.level);
        const textColor = sensor.level === 2 ? '#222' : '#fff';
        let valueDisplay = '';
        let tooltip = '';
        if (sensor.name.toLowerCase() === 'battery') {
            // Chỉ hiển thị phần trăm, không cần volt
            const batteryStr = getBatteryDisplay(sensor);
            valueDisplay = batteryStr.split('-')[0].trim();
            tooltip = batteryStr;
        } else {
            valueDisplay = sensor.value !== null && sensor.value !== undefined ? String(sensor.value) : '-';
            tooltip = `${sensor.name}: ${valueDisplay}`;
        }
        return `
            <g>
                <foreignObject x="${x - circleBubbleRadius}" y="${y - circleBubbleRadius}" width="${circleBubbleRadius * 2}" height="${circleBubbleRadius * 2}">
                    <div xmlns="http://www.w3.org/1999/xhtml" title="${tooltip}" style="
                        background: ${color};
                        color: ${textColor};
                        border-radius: 50%;
                        border: 3px solid #fff;
                        box-shadow: 0 4px 16px rgba(0,0,0,0.18);
                        width: ${circleBubbleRadius * 2}px;
                        height: ${circleBubbleRadius * 2}px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        font-family: 'Outfit', sans-serif;
                        text-align: center;
                        position: relative;
                        transition: box-shadow 0.2s, transform 0.2s;
                        user-select: none;
                        padding: 0;
                        overflow: hidden;
                        cursor: pointer;
                    ">
                        <div style="font-size: 19px; font-weight: 800; color: ${textColor}; line-height: 1.1;">${valueDisplay}</div>
                        <div style="font-size: 11px; font-weight: 600; opacity: 0.92; color: ${textColor}; margin-top: 2px; line-height: 1.1;">${sensor.name}</div>
                    </div>
                </foreignObject>
            </g>
        `;
    }).join('');

    return L.divIcon({
        html: `
            <div style="position: relative; width: 140px; height: 140px; display: flex; align-items: center; justify-content: center;">
                <svg width="${svgWidth}" height="${svgHeight}" style="position: absolute; top: 0; left: 0;">
                    ${sensorBubbles}
                    <!-- Center Station Icon -->
                    <g>
                        <circle cx="${center.x}" cy="${center.y}" r="24" fill="#fff" stroke="#00b894" stroke-width="4" />
                        <circle cx="${center.x}" cy="${center.y}" r="14" fill="#00b894" />
                        <circle cx="${center.x}" cy="${center.y}" r="6" fill="#fff" />
                    </g>
                </svg>
            </div>
        `,
        className: 'custom-station-marker-advanced',
        iconSize: [140, 140],
        iconAnchor: [70, 70],
        popupAnchor: [0, -70]
    });
};

const MapUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
    const map = useMap();
    React.useEffect(() => {
        map.setView(center, zoom);
    }, [center, zoom, map]);
    return null;
};

const MapComponent: React.FC<MapComponentProps> = ({ stationData, height = '384px' }) => {
    if (!stationData) {
        return <div className="flex items-center justify-center h-full text-gray-500">Chọn trạm để hiển thị bản đồ</div>;
    }
    const { coordinates, name, sensors, status } = stationData;
    const lat = coordinates.lat;
    const lng = coordinates.lng;
    // Lấy role user hiện tại
    const user = authService.getAuthState().user;
    const canViewBattery = user && (
        user.role === '1' || user.role === '2' ||
        user.role === 'admin' || user.role === 'manager'
    );
    // Lọc sensors: ẩn battery nếu user là 'user' hoặc '3'
    const filteredSensors = sensors.filter(sensor => {
        if (sensor.name.toLowerCase() === 'battery') {
            return canViewBattery;
        }
        return true;
    });

    return (
        <div style={{ height, width: '100%' }} className="rounded-lg overflow-hidden border border-gray-200">
            <MapContainer
                center={[lat, lng]}
                zoom={18}
                style={{ height: '100%', width: '100%', zIndex: 1 }}
                scrollWheelZoom={true}
            >
                <MapUpdater center={[lat, lng]} zoom={18} />
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
                />
                <Marker position={[lat, lng]} icon={createStationIcon({ ...stationData, sensors: filteredSensors })}>
                    <Popup>
                        <div className="font-bold mb-2">{name}</div>
                        <div className="space-y-2">
                            {filteredSensors.map(sensor => (
                                <div key={sensor.id} className="flex justify-between items-center py-1 px-2 bg-gray-50 rounded text-xs">
                                    <span className="font-medium">{sensor.name}:</span>
                                    <span className="font-semibold">
                                        {sensor.name.toLowerCase() === 'battery'
                                            ? getBatteryDisplay(sensor)
                                            : (sensor.value !== null && sensor.value !== undefined ? `${sensor.value} ${sensor.unit}` : '--')}
                                    </span>
                                </div>
                            ))}
                        </div>
                        <div className="mt-3 pt-2 border-t border-gray-200">
                            <p className="text-xs text-gray-400">
                                Lat: {lat.toFixed(6)}, Lng: {lng.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    );
};

export default MapComponent;