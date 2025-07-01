import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface UserInfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    userInfo: {
        fullName: string;
        email: string;
        workplace: string;
        position: string;
        phone?: string;
    };
    onSave?: (data: {
        fullName: string;
        email: string;
        workplace: string;
        position: string;
        phone?: string;
    }) => void;
}

const UserInfoModal: React.FC<UserInfoModalProps> = ({ isOpen, onClose, userInfo, onSave }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(userInfo);

    React.useEffect(() => {
        setEditData(userInfo);
        setIsEditing(false);
    }, [userInfo, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setEditData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = () => {
        setIsEditing(false);
        if (onSave) onSave(editData);
    };

    if (!isOpen) return null;
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm m-0 p-0">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                    aria-label="Đóng"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Thông tin cá nhân</h2>
                <form className="space-y-5" onSubmit={e => { e.preventDefault(); if (isEditing) handleSave(); }}>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                        <input
                            type="text"
                            name="fullName"
                            value={editData.fullName}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={editData.email}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại liên hệ</label>
                        <input
                            type="tel"
                            name="phone"
                            value={editData.phone || ''}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Đơn vị công tác</label>
                        <input
                            type="text"
                            name="workplace"
                            value={editData.workplace}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Chức vụ</label>
                        <input
                            type="text"
                            name="position"
                            value={editData.position}
                            disabled={!isEditing}
                            onChange={handleChange}
                            className={`w-full px-3 py-2 border border-gray-300 rounded-md ${isEditing ? 'bg-white' : 'bg-gray-100'} text-gray-900`}
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                                    onClick={() => { setIsEditing(false); setEditData(userInfo); }}
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                                >
                                    Lưu
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                                onClick={() => setIsEditing(true)}
                            >
                                Sửa thông tin
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default UserInfoModal; 