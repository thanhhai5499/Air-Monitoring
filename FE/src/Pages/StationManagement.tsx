import React, { useState, useEffect } from 'react';
import type { StationData } from '../types/station';
import DataTable from '../components/DataTable';
import { TableColumn } from '../types/components';
import Layout from '../components/Layout';
import StationDetailModal from '../components/StationDetailModal';
import { toast } from 'react-toastify';
import { fetchStationsDetailedList, fetchSensorTypes, fetchStationDetails, fetchSensorThresholds, createSensor, updateSensor, createSensorThreshold, updateSensorThreshold, createStation, updateStation } from '../services/dataApi';
import { useEffect as useEffectSensorTypes, useState as useStateSensorTypes } from 'react';
import { authService } from '../services/authService';
import Modal from '../components/Modal';
import { StationFormData, DetailedStationData } from '../types/pages';
import { formatExactApiTime } from '../utils/dateUtils';

// Thêm khai báo base URL cho station service
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';

const StationManagement: React.FC = () => {
    const [stations, setStations] = useState<DetailedStationData[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [selectedStation, setSelectedStation] = useState<DetailedStationData | null>(null);
    const [editingStation, setEditingStation] = useState<DetailedStationData | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [isTestingConnection, setIsTestingConnection] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'failed'>('idle');
    const [formData, setFormData] = useState<StationFormData>({
        name: '',
        coordinates: { lat: 0, lng: 0 },
        status: 'online',
        location: '',
        description: '',
        ipAddress: '',
        port: 8080
    });
    // State cho sensor types
    const [sensorTypes, setSensorTypes] = useStateSensorTypes<{ id: number, name: string }[]>([]);
    // State cho các sensor type được chọn
    const [selectedSensorTypeIds, setSelectedSensorTypeIds] = useState<number[]>([]);
    // State cho các sensor type đã có dữ liệu (không cho bỏ tích)
    const [lockedSensorTypeIds, setLockedSensorTypeIds] = useState<number[]>([]);
    const [sensorThresholds, setSensorThresholds] = useState<any[]>([]);
    const [selectedSensor, setSelectedSensor] = useState<any>(null);
    const [isSensorDetailOpen, setIsSensorDetailOpen] = useState(false);
    const user = authService.getCurrentUser();
    // Thêm state cho modal thêm sensor mới
    const [isAddSensorModalOpen, setIsAddSensorModalOpen] = useState(false);
    const [newSensor, setNewSensor] = useState({ name: '', description: '', unit: '' });
    // Thêm state cho thresholds
    const defaultThresholds = [
        { level: 1, minValue: '', maxValue: '', color: '#4CAF50', description: '' },
        { level: 2, minValue: '', maxValue: '', color: '#FFD600', description: '' },
        { level: 3, minValue: '', maxValue: '', color: '#FF9800', description: '' },
        { level: 4, minValue: '', maxValue: '', color: '#F44336', description: '' },
    ];
    const [thresholds, setThresholds] = useState(defaultThresholds);
    // State cho modal update sensor
    const [editingSensor, setEditingSensor] = useState<any>(null);
    const [isEditSensorModalOpen, setIsEditSensorModalOpen] = useState(false);
    const [editThresholds, setEditThresholds] = useState(defaultThresholds);
    // 1. Thêm state cho input tọa độ dạng chuỗi
    const [coordinatesInput, setCoordinatesInput] = useState('');

    useEffect(() => {
        const loadStations = async () => {
            try {
                const apiStations = await fetchStationsDetailedList();
                setStations(apiStations || []);
            } catch (error) {
                toast.error('Lỗi khi tải danh sách trạm!');
            }
        };
        loadStations();
    }, []);

    // Khi mở modal thêm mới, gọi API lấy sensor types
    useEffectSensorTypes(() => {
        if (isModalOpen) {
            fetchSensorTypes()
                .then(list => {
                    if (Array.isArray(list)) {
                        setSensorTypes(list.map((s: any) => ({ id: s.Id || s.id, name: s.Name || s.name })));
                        // Nếu đang sửa thì setSelectedSensorTypeIds theo sensors của trạm
                        if (editingStation) {
                            setSelectedSensorTypeIds(
                                editingStation.sensors
                                    .filter(s => s.sensorName.toLowerCase() !== 'battery')
                                    .map(s => s.sensorTypeId)
                            );
                        } else {
                            setSelectedSensorTypeIds([]); // chỉ reset khi thêm mới
                        }
                    }
                })
                .catch(() => setSensorTypes([]));
        }
    }, [isModalOpen, editingStation]);

    // Load sensor threshold khi mount trang
    useEffect(() => {
        const loadSensorThresholds = async () => {
            try {
                // Gọi đúng API, không truyền stationId
                const data = await fetchSensorThresholds();
                setSensorThresholds(data);
            } catch (error) {
                setSensorThresholds([]);
            }
        };
        loadSensorThresholds();
    }, []);

    // Xử lý chọn/bỏ chọn sensor type
    const handleToggleSensorType = (id: number) => {
        setSelectedSensorTypeIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    // Filter stations based on search term and status
    const filteredStations = stations.filter(station => {
        const search = searchTerm.toLowerCase();
        const nameMatch = station.name.toLowerCase().includes(search);
        const idMatch = station.id.toString().includes(search);
        const locationMatch = station.location && station.location.toLowerCase().includes(search);
        const matchesSearch = nameMatch || idMatch || locationMatch;
        const matchesStatus = statusFilter === 'all' || station.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Hàm đóng modal và reset state
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingStation(null);
        setConnectionStatus('idle');
        setFormData({
            name: '',
            coordinates: { lat: 0, lng: 0 },
            status: 'online',
            location: '',
            description: '',
            ipAddress: '',
            port: 8080
        });
        setCoordinatesInput('');
        setLockedSensorTypeIds([]);
    };

    // Open modal for adding new station
    const handleAddStation = () => {
        if (!isAdmin(user?.role)) return;
        setEditingStation(null);
        setConnectionStatus('idle');
        setFormData({
            name: '',
            coordinates: { lat: 0, lng: 0 },
            status: 'online',
            location: '',
            description: '',
            ipAddress: '',
            port: 8080
        });
        setCoordinatesInput('');
        setLockedSensorTypeIds([]); // Reset khi thêm mới
        setIsModalOpen(true);
    };

    // Open modal for editing station
    const handleEditStation = async (station: DetailedStationData) => {
        if (!isAdmin(user?.role)) return;
        setEditingStation(station);
        setConnectionStatus('idle');
        setFormData({
            name: station.name,
            coordinates: { lat: station.latitude, lng: station.longitude },
            status: station.status === 'active' ? 'online' : (station.status === 'maintenance' ? 'maintenance' : 'offline'),
            location: station.location || '',
            description: station.description || '',
            ipAddress: '',
            port: 8080
        });
        setCoordinatesInput(`${station.latitude}, ${station.longitude}`);
        try {
            const detail = await fetchStationDetails(station.id);
        } catch (err) {
            setLockedSensorTypeIds([]);
        }
        setIsModalOpen(true);
    };

    // Delete station
    const handleDeleteStation = (stationId: number) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa trạm này?')) {
            setStations(prev => prev.filter(station => station.id !== stationId));
        }
    };

    // Save station (add or edit)
    const handleSaveStation = async () => {
        // Validate required fields
        if (!formData.name.trim()) {
            toast.error('Vui lòng nhập tên trạm');
            return;
        }
        if (!formData.location.trim()) {
            toast.error('Vui lòng nhập vị trí trạm');
            return;
        }
        // Validate tọa độ
        const coords = coordinatesInput.split(',').map(s => parseFloat(s.trim()));
        if (coords.length !== 2 || coords.some(isNaN)) {
            toast.error('Vui lòng nhập đúng định dạng: vĩ độ, kinh độ (VD: 10.12345, 106.12345)');
            return;
        }
        if (coords[0] < -90 || coords[0] > 90 || coords[1] < -180 || coords[1] > 180) {
            toast.error('Vĩ độ phải từ -90 đến 90, kinh độ từ -180 đến 180');
            return;
        }

        const payload = {
            name: formData.name,
            location: formData.location,
            description: formData.description || '',
            latitude: coords[0],
            longitude: coords[1],
            status: formData.status === 'online' ? 'active' : (formData.status === 'maintenance' ? 'maintenance' : 'inactive'),
            sensorTypeIds: selectedSensorTypeIds
        };

        try {
            if (editingStation) {
                await updateStation(editingStation.id, payload);
            } else {
                await createStation(payload);
            }
            toast.success(editingStation ? 'Cập nhật trạm thành công!' : 'Thêm trạm mới thành công!');
            handleCloseModal();
            const apiStations = await fetchStationsDetailedList();
            setStations(apiStations || []);
        } catch (error: any) {
            let errorMessage = 'Có lỗi xảy ra khi lưu trạm';

            if (error?.message) {
                // Nếu message là JSON string, thử parse để lấy message
                try {
                    const parsed = JSON.parse(error.message);
                    errorMessage = parsed.message || error.message;
                } catch {
                    // Nếu không phải JSON, dùng message trực tiếp
                    errorMessage = error.message;
                }
            }

            toast.error(errorMessage);
        }
    };

    // Open detail modal for viewing station details
    const handleViewStationDetails = (station: DetailedStationData) => {
        setSelectedStation(station);
        setIsDetailModalOpen(true);
    };

    // Table columns configuration
    const columns: TableColumn[] = [
        {
            key: 'stt',
            title: 'STT',
            render: (_: any, __: any, index: number) => (
                <span>{index + 1}</span>
            )
        },
        {
            key: 'name',
            title: 'Tên Trạm'
        },
        {
            key: 'location',
            title: 'Vị Trí'
        },
        {
            key: 'coordinates',
            title: 'Tọa Độ',
            render: (value: any, record: DetailedStationData) => (
                <span className="text-sm text-gray-600">
                    {record.latitude.toFixed(4)}, {record.longitude.toFixed(4)}
                </span>
            )
        },
        {
            key: 'status',
            title: 'Trạng Thái',
            render: (value: any, record: DetailedStationData) => (
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${record.status === 'active'
                    ? 'bg-green-100 text-green-800'
                    : record.status === 'inactive'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                    {record.status === 'active' ? 'Hoạt động' :
                        record.status === 'inactive' ? 'Ngừng hoạt động' : 'Bảo trì'}
                </span>
            )
        },
        {
            key: 'sensors',
            title: 'Số Sensor',
            render: (value: any, record: DetailedStationData) => (
                <span className="text-sm text-gray-600">
                    {record.sensors.filter(sensor => sensor.sensorName.toLowerCase() !== 'battery').length} sensor
                </span>
            )
        },
        {
            key: 'lastUpdate',
            title: 'Cập Nhật Cuối',
            render: (value: any, record: DetailedStationData) => {
                // Tìm sensor có dữ liệu cập nhật gần nhất
                const latestSensor = record.sensors
                    .filter(sensor => sensor.lastReading)
                    .sort((a, b) => new Date(b.lastReading!.recordedAt).getTime() - new Date(a.lastReading!.recordedAt).getTime())[0];

                return (
                    <span className="text-sm text-gray-600">
                        {latestSensor?.lastReading?.recordedAt
                            ? formatExactApiTime(latestSensor.lastReading.recordedAt)
                            : 'Chưa có dữ liệu'}
                    </span>
                );
            }
        },
        {
            key: 'actions',
            title: 'Thao Tác',
            render: (value: any, record: DetailedStationData) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => handleViewStationDetails(record)}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                        title="Xem chi tiết trạm"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    {isAdmin(user?.role) && (
                        <button
                            onClick={() => handleEditStation(record)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Sửa thông tin trạm"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Định nghĩa columns cho bảng sensor
    const sensorColumns: TableColumn[] = [
        {
            key: 'stt',
            title: 'STT',
            render: (_: any, __: any, index: number) => (
                <span>{index + 1}</span>
            )
        },
        { key: 'name', title: 'Tên Sensor' },
        { key: 'description', title: 'Mô tả' },
        { key: 'unit', title: 'Đơn vị' },
        {
            key: 'actions',
            title: 'Thao Tác',
            render: (value: any, record: any) => (
                <div className="flex space-x-2">
                    <button
                        onClick={() => { setSelectedSensor(record); setIsSensorDetailOpen(true); }}
                        className="p-2 text-green-600 hover:text-green-900 hover:bg-green-50 rounded-lg transition-colors"
                        title="Xem chi tiết sensor"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    {isAdmin(user?.role) && (
                        <button
                            onClick={() => handleEditSensor(record)}
                            className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Cập nhật sensor"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                    )}
                </div>
            )
        }
    ];

    // Helper kiểm tra role không được phép
    const isNotAllowedToEdit = (role?: string) => {
        if (!role) return false;
        const r = role.toLowerCase();
        return r === 'manager' || r === 'user' || role === '2' || role === '3';
    };

    const isAdmin = (role?: string) => role && role.toLowerCase() === 'admin';

    // Hàm lấy màu mặc định theo level
    const getLevelColor = (level: number) => {
        switch (level) {
            case 1: return '#4CAF50'; // xanh lá
            case 2: return '#FFD600'; // vàng
            case 3: return '#FF9800'; // cam
            case 4: return '#F44336'; // đỏ
            default: return '#BDBDBD';
        }
    };

    // Khi mở modal, reset thresholds về mặc định 4 cấp
    const openAddSensorModal = () => {
        setIsAddSensorModalOpen(true);
        setNewSensor({ name: '', description: '', unit: '' });
        setThresholds(defaultThresholds);
    };

    // Hàm xử lý submit thêm sensor mới (gọi API thật)
    const handleAddSensorSubmit = async () => {
        if (!isAdmin(user?.role)) {
            toast.error('Bạn không có quyền thực hiện chức năng này!');
            return;
        }
        // Nếu không nhập tên sensor mà có nhập threshold, báo lỗi và return
        const hasAnyThreshold = thresholds.some(th => th.minValue !== '' || (th.level !== 4 && th.maxValue !== ''));
        if (!newSensor.name.trim() && hasAnyThreshold) {
            toast.error('Vui lòng nhập tên sensor trước khi thêm ngưỡng!');
            return;
        }
        if (!newSensor.name.trim()) {
            toast.error('Vui lòng nhập tên sensor');
            return;
        }
        if (!newSensor.unit.trim()) {
            toast.error('Vui lòng nhập đơn vị!');
            return;
        }
        try {
            // 1. Gọi API tạo sensor
            const sensor = await createSensor({
                name: newSensor.name,
                description: newSensor.description,
                unit: newSensor.unit
            });
            // 2. Nếu có threshold nào được nhập thì mới gọi API tạo threshold
            if (hasAnyThreshold) {
                for (const th of thresholds) {
                    let minValue: number | undefined = th.minValue === '' ? undefined : Number(th.minValue);
                    let maxValue: number | null = th.level === 4 ? null : (th.maxValue === '' ? null : Number(th.maxValue));
                    if (th.level === 1 && minValue === undefined) minValue = 0;
                    // Nếu cả min/max đều rỗng thì bỏ qua không tạo threshold này
                    if (minValue === undefined && maxValue === null) continue;
                    await createSensorThreshold({
                        sensorTypeId: sensor.Id || sensor.id,
                        level: th.level,
                        minValue,
                        maxValue,
                        color: th.color,
                        description: th.description
                    } as any);
                }
            }
            toast.success('Thêm sensor thành công!');
            setIsAddSensorModalOpen(false);
            setNewSensor({ name: '', description: '', unit: '' });
            setThresholds(defaultThresholds);
            // Reload lại danh sách sensor
            const apiSensorThresholds = await fetchSensorThresholds();
            setSensorThresholds(apiSensorThresholds);
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        }
    };

    // Hàm mở modal update sensor
    const handleEditSensor = (sensor: any) => {
        setEditingSensor(sensor);
        // Nếu sensor có đủ 4 threshold thì dùng, nếu thiếu thì bổ sung cho đủ 4 cấp
        let ths = Array.isArray(sensor.thresholds) ? [...sensor.thresholds] : [];
        for (let i = 1; i <= 4; i++) {
            if (!ths.find(t => t.level === i)) {
                ths.push({ level: i, minValue: '', maxValue: '', color: getLevelColor(i), description: '' });
            }
        }
        ths = ths.sort((a, b) => a.level - b.level).map(t => ({
            ...t,
            color: getLevelColor(t.level)
        }));
        setEditThresholds(ths);
        setIsEditSensorModalOpen(true);
    };

    // Hàm xử lý submit update sensor (gọi API thật)
    const handleUpdateSensorSubmit = async () => {
        if (!isAdmin(user?.role)) {
            toast.error('Bạn không có quyền thực hiện chức năng này!');
            return;
        }
        if (!editingSensor.name.trim() || !editingSensor.unit.trim()) {
            toast.error('Vui lòng nhập đầy đủ tên và đơn vị!');
            return;
        }
        try {
            // 1. Gọi API cập nhật sensor
            await updateSensor(editingSensor.id, {
                name: editingSensor.name,
                description: editingSensor.description,
                unit: editingSensor.unit
            });
            // 2. Gọi API cập nhật threshold cho sensor
            for (let i = 0; i < editThresholds.length; i++) {
                const th = editThresholds[i];
                const original = (editingSensor.thresholds && editingSensor.thresholds[i]) || {};
                let minValue: number | undefined = th.minValue === '' ? original.minValue : Number(th.minValue);
                let maxValue: number | null = th.level === 4 ? null : (th.maxValue === '' ? original.maxValue : Number(th.maxValue));
                if (th.level === 1 && minValue === undefined) minValue = 0;
                if ((th as any)?.id) {
                    await updateSensorThreshold((th as any).id, {
                        sensorTypeId: editingSensor.id,
                        level: th.level,
                        minValue,
                        maxValue,
                        color: th.color,
                        description: th.description
                    } as any);
                } else {
                    await createSensorThreshold({
                        sensorTypeId: editingSensor.id,
                        level: th.level,
                        minValue,
                        maxValue,
                        color: th.color,
                        description: th.description
                    } as any);
                }
            }
            toast.success('Cập nhật sensor thành công!');
            setIsEditSensorModalOpen(false);
            setEditingSensor(null);
            // Reload lại danh sách sensor
            const apiSensorThresholds = await fetchSensorThresholds();
            setSensorThresholds(apiSensorThresholds);
        } catch (err: any) {
            toast.error(err.message || 'Có lỗi xảy ra');
        }
    };

    return (
        <Layout>
            <div className="container mx-auto px-6 py-8">
                {/* Header + Filters */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Quản Lý Trạm Quan Trắc</h1>
                        <p className="text-gray-600">Quản lý tất cả các trạm quan trắc chất lượng không khí</p>
                    </div>
                    <div className="flex flex-col md:flex-row md:items-end gap-2 md:gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tìm kiếm</label>
                            <input
                                type="text"
                                placeholder="Tìm theo tên, ID trạm hoặc vị trí (location)..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-64 px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm w-44"
                            >
                                <option value="all">Tất cả</option>
                                <option value="active">Hoạt động</option>
                                <option value="inactive">Ngừng hoạt động</option>
                            </select>
                        </div>
                        {!isNotAllowedToEdit(user?.role) && (
                            <button
                                onClick={handleAddStation}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1.5 text-sm mt-2 md:mt-0"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm Trạm Mới
                            </button>
                        )}
                    </div>
                </div>

                {/* Data Table */}
                <div className="bg-white rounded-lg shadow">
                    <DataTable
                        data={filteredStations}
                        columns={columns}
                    />
                </div>

                {/* Station Detail Modal */}
                <StationDetailModal
                    station={selectedStation}
                    isOpen={isDetailModalOpen}
                    onClose={() => {
                        setIsDetailModalOpen(false);
                        setSelectedStation(null);
                    }}
                />

                {/* Modal for Add/Edit Station */}
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 overflow-y-auto">
                        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={handleCloseModal}></div>

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
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập tên trạm..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vị trí (Location)
                                            </label>
                                            <input
                                                type="text"
                                                value={formData.location}
                                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập vị trí trạm..."
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Mô tả
                                            </label>
                                            <textarea
                                                value={formData.description}
                                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Nhập mô tả trạm..."
                                                rows={3}
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Vĩ độ, Kinh độ (Latitude, Longitude)
                                            </label>
                                            <input
                                                type="text"
                                                value={coordinatesInput}
                                                onChange={e => setCoordinatesInput(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                placeholder="Vĩ độ, Kinh độ"
                                            />
                                        </div>

                                        {/* Danh sách chỉ số (sensor types) */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Các chỉ số sẽ có của trạm:
                                            </label>
                                            <div className="flex flex-col gap-2 pl-2">
                                                {sensorTypes.length === 0 && <span>Đang tải...</span>}
                                                {sensorTypes.filter(type => type.name.toLowerCase() !== 'battery').map(type => {
                                                    // So sánh id đồng nhất kiểu string để tránh lỗi disable
                                                    const isLocked = lockedSensorTypeIds.map(String).includes(String(type.id));
                                                    return (
                                                        <label key={type.id} className="inline-flex items-center gap-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedSensorTypeIds.includes(type.id)}
                                                                onChange={() => handleToggleSensorType(type.id)}
                                                                className="form-checkbox h-4 w-4 text-blue-600"
                                                                disabled={isLocked}
                                                            />
                                                            <span>{type.name}</span>
                                                            {isLocked && (
                                                                <span className="ml-2 text-xs text-gray-500 italic">Đã có dữ liệu</span>
                                                            )}
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Trạng thái
                                            </label>
                                            <select
                                                value={formData.status}
                                                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            >
                                                <option value="online">Hoạt động</option>
                                                <option value="offline">Ngừng hoạt động</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    {!isNotAllowedToEdit(user?.role) && (
                                        <button
                                            onClick={handleSaveStation}
                                            className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500`}
                                        >
                                            {editingStation ? 'Cập Nhật' : 'Thêm Mới'}
                                        </button>
                                    )}
                                    <button
                                        onClick={handleCloseModal}
                                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Hủy
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bảng hiển thị danh sách sensor */}
                <div className="bg-white rounded-lg shadow mt-8">
                    <div className="flex items-center justify-between px-6 pt-6">
                        <h2 className="text-lg font-semibold">Danh sách các chỉ số đo lường</h2>
                        {isAdmin(user?.role) && (
                            <button
                                onClick={openAddSensorModal}
                                className="bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 flex items-center gap-1.5 text-sm"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Thêm Sensor mới
                            </button>
                        )}
                    </div>
                    <div className="p-6">
                        <DataTable data={sensorThresholds} columns={sensorColumns} />
                    </div>
                    {/* Modal thêm sensor mới */}
                    {isAddSensorModalOpen && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    onClick={() => setIsAddSensorModalOpen(false)}
                                ></div>
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Thêm Sensor Mới
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tên Sensor
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSensor.name}
                                                    onChange={e => setNewSensor({ ...newSensor, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="VD: PM2.5, UV, ..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSensor.description}
                                                    onChange={e => setNewSensor({ ...newSensor, description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Mô tả ngắn gọn"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Đơn vị
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newSensor.unit}
                                                    onChange={e => setNewSensor({ ...newSensor, unit: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="VD: µg/m3, %, index, ..."
                                                />
                                            </div>
                                            {/* Thêm UI nhập thresholds */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ngưỡng (Thresholds)
                                                </label>
                                                <div className="space-y-2">
                                                    {thresholds.map((th, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <span className="w-14 font-semibold">Level {th.level}</span>
                                                            {th.level === 4 ? (
                                                                <input
                                                                    type="number"
                                                                    placeholder="Max"
                                                                    value={th.minValue}
                                                                    onChange={e => setThresholds(ths => ths.map((item, i) =>
                                                                        i === idx ? { ...item, minValue: e.target.value } : item
                                                                    ))}
                                                                    className="w-16 border rounded px-2 py-1 text-sm"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Min"
                                                                        value={th.minValue}
                                                                        onChange={e => setThresholds(ths => ths.map((item, i) =>
                                                                            i === idx ? { ...item, minValue: e.target.value } : item
                                                                        ))}
                                                                        className="w-16 border rounded px-2 py-1 text-sm"
                                                                    />
                                                                    <span>-</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Max"
                                                                        value={th.maxValue}
                                                                        onChange={e => setThresholds(ths => ths.map((item, i) =>
                                                                            i === idx ? { ...item, maxValue: e.target.value } : item
                                                                        ))}
                                                                        className="w-16 border rounded px-2 py-1 text-sm"
                                                                    />
                                                                </>
                                                            )}
                                                            <input
                                                                type="text"
                                                                placeholder="Mô tả"
                                                                value={th.description}
                                                                onChange={e => setThresholds(ths => ths.map((item, i) =>
                                                                    i === idx ? { ...item, description: e.target.value } : item
                                                                ))}
                                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            onClick={handleAddSensorSubmit}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                                        >
                                            {editingStation ? 'Cập Nhật' : 'Thêm mới'}
                                        </button>
                                        <button
                                            onClick={() => setIsAddSensorModalOpen(false)}
                                            className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    {/* Modal chi tiết sensor */}
                    {isSensorDetailOpen && selectedSensor && (
                        <Modal isOpen={isSensorDetailOpen} onClose={() => setIsSensorDetailOpen(false)}>
                            <div className="p-6 max-w-xl w-full rounded-2xl bg-white shadow-2xl">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold text-gray-900">Chi tiết chỉ số: {selectedSensor.name}</h3>
                                    <button
                                        onClick={() => setIsSensorDetailOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 focus:outline-none rounded-full transition-colors"
                                        style={{ minWidth: 40, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                        aria-label="Đóng"
                                    >
                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Tên Sensor</label>
                                        <p className="text-base text-gray-900">{selectedSensor.name}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
                                        <p className="text-base text-gray-900">{selectedSensor.description || 'Không có mô tả'}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700">Đơn vị</label>
                                        <p className="text-base text-gray-900">{selectedSensor.unit}</p>
                                    </div>
                                </div>
                                <div className="mb-2">
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Ngưỡng (Thresholds):</label>
                                    {selectedSensor.thresholds && selectedSensor.thresholds.length > 0 ? (
                                        <div className="border rounded-xl divide-y divide-gray-200 bg-gray-50">
                                            {selectedSensor.thresholds.map((th: any) => (
                                                <div key={th.id} className="flex items-center gap-4 px-5 py-3">
                                                    <span
                                                        style={{
                                                            display: 'inline-block',
                                                            width: 20,
                                                            height: 20,
                                                            backgroundColor: th.color,
                                                            borderRadius: 6,
                                                            border: '1.5px solid #ccc'
                                                        }}
                                                    />
                                                    <span className="font-bold text-base mr-2">Level {th.level}:</span>
                                                    <span className="text-base text-gray-900 flex-1">{th.description}</span>
                                                    <span className="text-sm text-gray-500">{th.minValue} - {th.maxValue ?? '∞'} {selectedSensor.unit}</span>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 italic px-2 py-1">Không có ngưỡng</div>
                                    )}
                                </div>
                            </div>
                        </Modal>
                    )}
                    {/* Modal update sensor */}
                    {isEditSensorModalOpen && editingSensor && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                                <div
                                    className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                                    onClick={() => setIsEditSensorModalOpen(false)}
                                ></div>
                                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                        <h3 className="text-lg font-medium text-gray-900 mb-4">
                                            Cập Nhật Sensor
                                        </h3>
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Tên Sensor
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingSensor.name}
                                                    onChange={e => setEditingSensor({ ...editingSensor, name: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="VD: PM2.5, UV, ..."
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Mô tả
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingSensor.description}
                                                    onChange={e => setEditingSensor({ ...editingSensor, description: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="Mô tả ngắn gọn"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Đơn vị
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingSensor.unit}
                                                    onChange={e => setEditingSensor({ ...editingSensor, unit: e.target.value })}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                    placeholder="VD: µg/m3, %, index, ..."
                                                />
                                            </div>
                                            {/* Thêm UI nhập thresholds */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Ngưỡng (Thresholds)
                                                </label>
                                                <div className="space-y-2">
                                                    {editThresholds.map((th, idx) => (
                                                        <div key={idx} className="flex items-center gap-2">
                                                            <span className="w-14 font-semibold">Level {th.level}</span>
                                                            {th.level === 4 ? (
                                                                <input
                                                                    type="number"
                                                                    placeholder="Max"
                                                                    value={th.minValue}
                                                                    onChange={e => setEditThresholds(ths => ths.map((item, i) =>
                                                                        i === idx ? { ...item, minValue: e.target.value } : item
                                                                    ))}
                                                                    className="w-16 border rounded px-2 py-1 text-sm"
                                                                />
                                                            ) : (
                                                                <>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Min"
                                                                        value={th.minValue}
                                                                        onChange={e => setEditThresholds(ths => ths.map((item, i) =>
                                                                            i === idx ? { ...item, minValue: e.target.value } : item
                                                                        ))}
                                                                        className="w-16 border rounded px-2 py-1 text-sm"
                                                                    />
                                                                    <span>-</span>
                                                                    <input
                                                                        type="number"
                                                                        placeholder="Max"
                                                                        value={th.maxValue}
                                                                        onChange={e => setEditThresholds(ths => ths.map((item, i) =>
                                                                            i === idx ? { ...item, maxValue: e.target.value } : item
                                                                        ))}
                                                                        className="w-16 border rounded px-2 py-1 text-sm"
                                                                    />
                                                                </>
                                                            )}
                                                            <input
                                                                type="text"
                                                                placeholder="Mô tả"
                                                                value={th.description}
                                                                onChange={e => setEditThresholds(ths => ths.map((item, i) =>
                                                                    i === idx ? { ...item, description: e.target.value } : item
                                                                ))}
                                                                className="flex-1 border rounded px-2 py-1 text-sm"
                                                            />
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                        <button
                                            onClick={handleUpdateSensorSubmit}
                                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500"
                                        >
                                            Cập Nhật
                                        </button>
                                        <button
                                            onClick={() => setIsEditSensorModalOpen(false)}
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
            </div>
        </Layout>
    );
};

export default StationManagement; 