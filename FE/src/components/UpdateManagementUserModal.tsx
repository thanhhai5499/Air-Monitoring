import React, { useState, useEffect } from 'react';

interface UpdateManagementUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updates: { status: string }) => void;
    user: { role: string; status: string; ValidFrom?: string; ValidTo?: string };
    /** Khi true: đang active và chưa hết hạn → không cho chuyển sang inactive */
    canChangeToInactive?: boolean;
}

const UpdateManagementUserModal: React.FC<UpdateManagementUserModalProps> = ({ isOpen, onClose, onUpdate, user, canChangeToInactive = true }) => {
    const [status, setStatus] = useState(
        user.status.toLowerCase() === 'active' ? 'active' : 'inactive'
    );

    useEffect(() => {
        setStatus(user.status.toLowerCase() === 'active' ? 'active' : 'inactive');
    }, [user]);

    if (!isOpen) {
        return null;
    }

    const handleUpdate = () => {
        onUpdate({ status });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cập nhật tài khoản</h3>

                    <div className="mt-4 px-7 py-3 space-y-4">
                        <div>
                            <label className="text-left block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
                            >
                                <option value="active">Hoạt động</option>
                                <option value="inactive" disabled={!canChangeToInactive}>
                                    Ngừng hoạt động
                                </option>
                            </select>
                            {!canChangeToInactive && (
                                <p className="mt-1 text-xs text-amber-600">Tài khoản đang hoạt động không thể chuyển sang ngừng hoạt động.</p>
                            )}
                        </div>
                    </div>

                    <div className="items-center px-4 py-3">
                        <button
                            onClick={handleUpdate}
                            className="px-4 py-2 bg-blue-500 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
                        >
                            Cập nhật
                        </button>
                        <button
                            onClick={onClose}
                            className="mt-3 px-4 py-2 bg-gray-200 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UpdateManagementUserModal; 