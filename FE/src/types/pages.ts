// Page-specific interfaces

export interface StationFormData {
    name: string;
    coordinates: { lat: number; lng: number };
    status: 'online' | 'offline' | 'maintenance';
    location: string;
    description: string;
    ipAddress: string;
    port: number;
}

export interface DetailedStationData {
    id: number;
    name: string;
    location: string;
    latitude: number;
    longitude: number;
    status: string;
    description: string;
    createdAt: string;
    updatedAt: string;
    sensors: Array<{
        sensorTypeId: number;
        sensorName: string;
        sensorDescription: string;
        unit: string;
        lastReading: {
            value: number;
            recordedAt: string;
        } | null;
    }>;
}

export interface DashboardProps {
    // Add dashboard specific props if needed
} 