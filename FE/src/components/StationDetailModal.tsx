import React from 'react';
import { formatExactApiTime } from '../utils/dateUtils';

interface StationDetailModalProps {
    station: {
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
    } | null;
    isOpen: boolean;
    onClose: () => void;
}

const StationDetailModal: React.FC<StationDetailModalProps> = ({ station, isOpen, onClose }) => {
    if (!isOpen || !station) return null;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            case 'maintenance':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active':
                return 'Hoạt động';
            case 'inactive':
                return 'Ngừng hoạt động';
            case 'maintenance':
                return 'Bảo trì';
            default:
                return status;
        }
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-medium text-gray-900">
                                Chi Tiết Trạm: {station.name}
                            </h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Station Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-4">
                                {/* <div>
                                    <label className="block text-sm font-medium text-gray-700">ID Trạm</label>
                                    <p className="text-sm text-gray-900">{station.id}</p>
                                </div> */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tên Trạm</label>
                                    <p className="text-sm text-gray-900">{station.name}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Vị Trí</label>
                                    <p className="text-sm text-gray-900">{station.location}</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Mô Tả</label>
                                    <p className="text-sm text-gray-900">{station.description || 'Không có mô tả'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tọa Độ</label>
                                    <p className="text-sm text-gray-900">
                                        {station.latitude.toFixed(6)}, {station.longitude.toFixed(6)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Trạng Thái</label>
                                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(station.status)}`}>
                                        {getStatusText(station.status)}
                                    </span>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Ngày Tạo</label>
                                    <p className="text-sm text-gray-900">
                                        {formatExactApiTime(station.createdAt)}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Cập Nhật Cuối</label>
                                    <p className="text-sm text-gray-900">
                                        {formatExactApiTime(station.updatedAt)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Sensors Information */}
                        <div>
                            <h4 className="text-md font-medium text-gray-900 mb-4">
                                Danh Sách Sensors ({station.sensors.length})
                            </h4>
                            {station.sensors.filter(sensor => sensor.sensorName.toLowerCase() !== 'battery').length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Tên Sensor
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Mô Tả
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Đơn Vị
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Giá Trị Cuối
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Thời Gian Cập Nhật
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {station.sensors.filter(sensor => sensor.sensorName.toLowerCase() !== 'battery').map((sensor, index) => (
                                                <tr key={index} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {sensor.sensorName}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {sensor.sensorDescription}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {sensor.unit}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                        {sensor.lastReading ? (
                                                            <span className="font-medium">
                                                                {sensor.lastReading.value} {sensor.unit}
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">Chưa có dữ liệu</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {sensor.lastReading ? (
                                                            formatExactApiTime(sensor.lastReading.recordedAt)
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <h3 className="mt-2 text-sm font-medium text-gray-900">Không có sensors</h3>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Trạm này chưa được gán sensors nào.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StationDetailModal; 