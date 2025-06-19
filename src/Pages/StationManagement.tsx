import React, { useState, useEffect } from 'react';
import { StationData } from '../types/station';
import { mockStations } from '../data/mockStations';
import DataTable, { TableColumn } from '../components/DataTable';
import Layout from '../components/Layout';

interface StationFormData {
    name: string;
    coordinates: { lat: number; lng: number };
    status: 'online' | 'offline' | 'maintenance';
    ipAddress: string;
    port: number;
}

const StationManagement: React.FC = () => {
    const [stations, setStations] = useState<StationData[]>(mockStations);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingStation, setEditingStation] = useState<StationData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'offline' | 'maintenance'>('all');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [formData, setFormData] = useState<StationFormData>({
        name: '',
        coordinates: { lat: 0, lng: 0 },
        status: 'online',
        ipAddress: '',
        port: 8080
    });

    // Filter stations based on search term and status
    const filteredStations = stations.filter(station => {
        const matchesSearch = station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            station.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Test connection to station
    const handleTestConnection = async () => {
        if (!formData.ipAddress) {
            alert('Vui lòng nhập địa chỉ IP');
            return;
        }

        setIsTestingConnection(true);
        setConnectionStatus('idle');

        try {
            // Simulate API call to test connection
            // In real app, this would ping the station at formData.ipAddress:formData.port
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            // Enhanced IP validation for better demo
            const ipParts = formData.ipAddress.split('.');
            const isValidIP = ipParts.length === 4 && 
                             ipParts.every(part => {
                                 const num = parseInt(part);
                                 return !isNaN(num) && num >= 0 && num <= 255;
                             });
            
            // Additional validation rules for demo purposes
            const isValidPort = formData.port > 0 && formData.port <= 65535;
            const isReachableIP = !formData.ipAddress.startsWith('192.168.1.99') && // Simulate unreachable range
                                 !formData.ipAddress.includes('0.0.0') && // Invalid range
                                 formData.ipAddress !== '127.0.0.1'; // Localhost not allowed
            
            if (isValidIP && isValidPort && isReachableIP) {
                setConnectionStatus('success');
                // Auto set status to online if connection successful
                setFormData(prev => ({ ...prev, status: 'online' }));
            } else {
                setConnectionStatus('failed');
            }
        } catch (error) {
            setConnectionStatus('failed');
        } finally {
            setIsTestingConnection(false);
        }
    };

    // Open modal for adding new station
    const handleAddStation = () => {
        setEditingStation(null);
        setConnectionStatus('idle');
        setFormData({
            name: '',
            coordinates: { lat: 10.849, lng: 106.802 },
            status: 'online',
            ipAddress: '',
            port: 8080
        });
        setIsModalOpen(true);
    };

    // Open modal for editing station
    const handleEditStation = (station: StationData) => {
        setEditingStation(station);
        setConnectionStatus('idle');
        setFormData({
            name: station.name,
            coordinates: station.coordinates,
            status: station.status,
            ipAddress: station.ipAddress || '',
            port: station.port || 8080
        });
        setIsModalOpen(true);
    };

    // Delete station
    const handleDeleteStation = (stationId: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa trạm này?')) {
            setStations(prev => prev.filter(station => station.id !== stationId));
        }
    };

    // Save station (add or edit)
    const handleSaveStation = () => {
        // Validate required fields
        if (!formData.name.trim()) {
            alert('Vui lòng nhập tên trạm');
            return;
        }

        if (!formData.ipAddress.trim()) {
            alert('Vui lòng nhập địa chỉ IP');
            return;
        }

        // Check if connection test is successful
        if (connectionStatus !== 'success') {
            alert('Vui lòng kiểm tra kết nối thành công trước khi lưu trạm');
            return;
        }

        if (editingStation) {
            // Edit existing station
            setStations(prev => prev.map(station => 
                station.id === editingStation.id 
                    ? {
                        ...station,
                        name: formData.name,
                        coordinates: formData.coordinates,
                        status: formData.status,
                        ipAddress: formData.ipAddress,
                        port: formData.port,
                        lastUpdated: new Date().toISOString()
                    }
                    : station
            ));
        } else {
            // Add new station
            const newStation: StationData = {
                id: `A${String(Date.now()).slice(-3).padStart(3, '0')}`,
                name: formData.name,
                coordinates: formData.coordinates,
                status: formData.status,
                ipAddress: formData.ipAddress,
                port: formData.port,
                airQuality: {
                    uv: null,
                    pm25: null,
                    pm1_0: null
                },
                battery: 100,
                lastUpdated: new Date().toISOString()
            };
            setStations(prev => [...prev, newStation]);
        }

        setIsModalOpen(false);
        setConnectionStatus('idle'); // Reset connection status
    };

    // Table columns configuration
    const columns: TableColumn[] = [
        {
            key: 'id',
            title: 'ID Trạm'
        },
        {
            key: 'name',
            title: 'Tên Trạm'
        },
        {
            key: 'coordinates',
            title: 'Tọa Độ',
            render: (value: any, record: StationData) => (
                <span className="text-sm text-gray-600">
                    {record.coordinates.lat.toFixed(4)}, {record.coordinates.lng.toFixed(4)}
                </span>
            )
        },
        {
            key: 'connection',
            title: 'Kết Nối',
            render: (value: any, record: StationData) => (
                <div className="text-sm">
                    <div className="text-gray-900 font-medium">
                        {record.ipAddress || 'N/A'}
                    </div>
                    <div className="text-gray-500">
                        Port: {record.port || 'N/A'}
                    </div>
                </div>
            )
        },
        {
            key: 'status',
            title: 'Trạng Thái',
            render: (value: any, record: StationData) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    record.status === 'online'
                        ? 'bg-green-100 text-green-800'
                        : record.status === 'offline'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                }`}>
                    {record.status === 'online' ? 'Hoạt động' : 
                     record.status === 'offline' ? 'Ngoại tuyến' : 'Bảo trì'}
                </span>
            )
        },
        {
            key: 'battery',
            title: 'Pin',
            render: (value: any, record: StationData) => (
                <div className="flex items-center">
                    <div className="w-full bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                            className={`h-2 rounded-full ${
                                (record.battery || 0) > 50 ? 'bg-green-500' :
                                (record.battery || 0) > 20 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${record.battery || 0}%` }}
                        ></div>
                    </div>
                    <span className="text-sm text-gray-600">{record.battery || 0}%</span>
                </div>
            )
        },
        {
            key: 'lastUpdated',
            title: 'Cập Nhật Cuối',
            render: (value: any, record: StationData) => (
                <span className="text-sm text-gray-600">
                    {record.lastUpdated ? new Date(record.lastUpdated).toLocaleString('vi-VN') : 'N/A'}
                </span>
            )
        },
        {
            key: 'actions',
            title: 'Thao Tác',
            render: (value: any, record: StationData) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleEditStation(record)}
                        className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Sửa thông tin trạm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </button>
                    <button
                        onClick={() => handleDeleteStation(record.id)}
                        className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa trạm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            )
        }
    ];

    return (
        <Layout>
            <div className="container mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Trạm Quan Trắc</h1>
                        <p className="text-gray-600">Quản lý tất cả các trạm quan trắc chất lượng không khí</p>
                    </div>
                    <button
                        onClick={handleAddStation}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                    >
                        <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Thêm Trạm Mới
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Tổng Trạm</p>
                                <p className="text-2xl font-bold text-gray-900">{stations.length}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Hoạt Động</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stations.filter(s => s.status === 'online').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-red-100 rounded-lg">
                                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Ngoại Tuyến</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stations.filter(s => s.status === 'offline').length}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="flex items-center">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Bảo Trì</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {stations.filter(s => s.status === 'maintenance').length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Tìm kiếm
                            </label>
                            <input
                                type="text"
                                placeholder="Tìm theo tên hoặc ID trạm..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Trạng thái
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">Tất cả</option>
                                <option value="online">Hoạt động</option>
                                <option value="offline">Ngoại tuyến</option>
                                <option value="maintenance">Bảo trì</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow">
                    <DataTable
                        data={filteredStations}
                        columns={columns}
                    />
                </div>

            {/* Modal for Add/Edit Station */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsModalOpen(false)}></div>

                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <h3 className="text-lg font-medium text-gray-900 mb-4">
                                    {editingStation ? 'Sửa Thông Tin Trạm' : 'Thêm Trạm Mới'}
                                </h3>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Tên trạm
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            placeholder="Nhập tên trạm..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vĩ độ (Latitude)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={formData.coordinates.lat}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    coordinates: {
                                                        ...formData.coordinates,
                                                        lat: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Kinh độ (Longitude)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.000001"
                                                value={formData.coordinates.lng}
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    coordinates: {
                                                        ...formData.coordinates,
                                                        lng: parseFloat(e.target.value) || 0
                                                    }
                                                })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>

                                    {/* Connection Settings */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-sm font-medium text-gray-700 mb-3">Thông tin kết nối</h4>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Địa chỉ IP
                                                </label>
                                                <input
                                                    type="text"
                                                    value={formData.ipAddress}
                                                    onChange={(e) => {
                                                        setFormData({...formData, ipAddress: e.target.value});
                                                        setConnectionStatus('idle');
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="192.168.1.100"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Port
                                                </label>
                                                <input
                                                    type="number"
                                                    value={formData.port}
                                                    onChange={(e) => {
                                                        setFormData({...formData, port: parseInt(e.target.value) || 8080});
                                                        setConnectionStatus('idle');
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                />
                                            </div>
                                        </div>

                                        {/* Test Connection Button and Status */}
                                        <div className="mt-3 flex items-center gap-3">
                                            <button
                                                type="button"
                                                onClick={handleTestConnection}
                                                disabled={isTestingConnection || !formData.ipAddress}
                                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                                                    isTestingConnection || !formData.ipAddress
                                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                                        : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                                }`}
                                            >
                                                {isTestingConnection ? (
                                                    <>
                                                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-700 inline" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        Đang kiểm tra...
                                                    </>
                                                ) : (
                                                    <>
                                                        <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                                        </svg>
                                                        Kiểm tra kết nối
                                                    </>
                                                )}
                                            </button>

                                            {/* Connection Status Indicator */}
                                            {connectionStatus === 'success' && (
                                                <div className="flex items-center text-green-600 text-sm">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Kết nối thành công
                                                </div>
                                            )}
                                            {connectionStatus === 'failed' && (
                                                <div className="flex items-center text-red-600 text-sm">
                                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    Không thể kết nối
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Trạng thái
                                        </label>
                                        <select
                                            value={formData.status}
                                            onChange={(e) => setFormData({...formData, status: e.target.value as any})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            disabled={connectionStatus === 'success'}
                                        >
                                            <option value="online">Hoạt động</option>
                                            <option value="offline">Ngoại tuyến</option>
                                            <option value="maintenance">Bảo trì</option>
                                        </select>
                                        {connectionStatus === 'success' && (
                                            <p className="text-xs text-green-600 mt-1">Trạng thái được tự động đặt thành "Hoạt động" sau khi kết nối thành công</p>
                                        )}
                                    </div>

                                    {/* Connection Status Alert */}
                                    {connectionStatus !== 'success' && (
                                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                            <div className="flex items-center">
                                                <svg className="w-4 h-4 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                                </svg>
                                                <p className="text-sm text-yellow-800">
                                                    <strong>Lưu ý:</strong> Bạn phải kiểm tra kết nối thành công trước khi có thể lưu trạm.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    onClick={handleSaveStation}
                                    disabled={connectionStatus !== 'success'}
                                    className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${
                                        connectionStatus === 'success'
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    {editingStation ? 'Cập Nhật' : 'Thêm Mới'}
                                </button>
                                <button
                                    onClick={() => {
                                        setIsModalOpen(false);
                                        setConnectionStatus('idle');
                                    }}
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            </div>
        </Layout>
    );
};

export default StationManagement; 