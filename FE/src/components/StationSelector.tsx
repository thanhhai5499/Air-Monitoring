import React, { useState, useRef, useEffect } from 'react';

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
    status: 'online' | 'offline' | 'maintenance';
    lastUpdated?: string;
}

interface StationSelectorProps {
    stations: StationData[];
    selectedStation: StationData | null;
    onStationChange: (station: StationData) => void;
    placeholder?: string;
    className?: string;
    showAirQuality?: boolean;
}

const StationSelector: React.FC<StationSelectorProps> = ({
    stations,
    selectedStation,
    onStationChange,
    placeholder = "Chọn trạm...",
    className = "",
    showAirQuality = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleStationSelect = (station: StationData) => {
        onStationChange(station);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 w-full px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200 text-left shadow-sm h-[36px]"
            >
                <div className="flex-1">
                    {selectedStation ? (
                        <h3 className="font-semibold text-gray-900 text-sm">
                            {selectedStation.name}
                        </h3>
                    ) : (
                        <h3 className="font-medium text-gray-500 text-sm">
                            {placeholder}
                        </h3>
                    )}
                </div>

                <div className="flex items-center space-x-2">
                    {selectedStation && (
                        <span className={`inline-block w-3 h-3 rounded-full ${selectedStation.status === 'online' ? 'bg-green-500' :
                            selectedStation.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></span>
                    )}
                    <svg
                        className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="dropdown-menu absolute top-full left-0 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 py-2 max-h-80 overflow-y-auto">
                    {stations.length === 0 ? (
                        <div className="px-4 py-3 text-sm text-gray-500 text-center">
                            Không có trạm nào trong hệ thống
                        </div>
                    ) : (
                        stations.map((station) => (
                            <button
                                key={station.id}
                                onClick={() => handleStationSelect(station)}
                                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-150 ${selectedStation?.id === station.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900 text-sm">
                                            {station.name}
                                        </h4>

                                        {showAirQuality && (
                                            <div className="flex items-center space-x-4 mt-2 text-xs">
                                                <span className="text-gray-600">
                                                    UV: <span className="font-medium">
                                                        {station.airQuality.uv?.toFixed(1) || '-'}
                                                    </span>
                                                </span>
                                                <span className="text-gray-600">
                                                    PM1.0: <span className="font-medium">
                                                        {station.airQuality.pm1_0?.toFixed(1) || '-'}
                                                    </span>
                                                </span>
                                                <span className="text-gray-600">
                                                    PM2.5: <span className="font-medium">
                                                        {station.airQuality.pm25?.toFixed(1) || '-'}
                                                    </span>
                                                </span>
                                            </div>
                                        )}

                                        <div className="flex items-center mt-2">
                                            <span className="text-xs text-gray-400">
                                                {station.status === 'online' ? 'Hoạt động' :
                                                    station.status === 'offline' ? 'Offline' : 'Bảo trì'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-center ml-3">
                                        <span className={`inline-block w-3 h-3 rounded-full ${station.status === 'online' ? 'bg-green-500' :
                                            station.status === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                                            }`}></span>
                                        {selectedStation?.id === station.id && (
                                            <svg className="w-4 h-4 text-blue-500 mt-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default StationSelector; 