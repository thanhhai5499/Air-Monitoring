import React, { useState, useEffect } from 'react';

interface UpdateManagementUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (updates: { role: string; status: string }) => void;
    user: { role: string; status: string };
}

const UpdateManagementUserModal: React.FC<UpdateManagementUserModalProps> = ({ isOpen, onClose, onUpdate, user }) => {
    const [role, setRole] = useState(user.role);
    const [status, setStatus] = useState(user.status);

    useEffect(() => {
        setRole(user.role);
        setStatus(user.status);
    }, [user]);

    if (!isOpen) {
        return null;
    }

    const handleUpdate = () => {
        onUpdate({ role, status });
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                <div className="mt-3 text-center">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Cập nhật tài khoản</h3>

                    <div className="mt-4 px-7 py-3 space-y-4">
                        <div>
                            <label className="text-left block text-sm font-medium text-gray-700 mb-1">Vai trò</label>
                            <select
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="w-full px-3 py-2 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
                            >
                                <option value="Admin">Admin</option>
                                <option value="Moderator">Moderator</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-left block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 text-base text-gray-700 placeholder-gray-600 border rounded-lg focus:shadow-outline"
                            >
                                <option value="Active">Hoạt động</option>
                                <option value="Inactive">Ngừng hoạt động</option>
                                <option value="Pending">Chờ duyệt</option>
                            </select>
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