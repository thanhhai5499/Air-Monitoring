import React, { useState } from 'react';
import { mockUsers } from '../data/mockUsers';
import Layout from '../components/Layout';
import UpdateManagementUserModal from '../components/UpdateManagementUserModal';
import UpdateUserStatusModal from '../components/UpdateUserStatusModal';
import DeactivateUserModal from '../components/DeactivateUserModal';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState(mockUsers);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; role: string; status: string } | null>(null);
    const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);

    const handleOpenManagementModal = (user: { id: string, role: string, status: string }) => {
        setSelectedUser(user);
        setIsManagementModalOpen(true);
        setIsStatusModalOpen(false);
        setIsDeactivateModalOpen(false);
        setSelectedUser(null);
        setUserToDeactivate(null);
    };

    const handleOpenStatusModal = (userId: string, currentStatus: string) => {
        setSelectedUser({ id: userId, status: currentStatus, role: '' }); // Role is not needed here
        setIsStatusModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsManagementModalOpen(false);
        setIsStatusModalOpen(false);
        setIsDeactivateModalOpen(false);
        setSelectedUser(null);
        setUserToDeactivate(null);
    };

    const handleUpdateManagementUser = (updates: { role: string; status: string }) => {
        if (selectedUser) {
            setUsers(users.map(user =>
                user.id === selectedUser.id ? { ...user, ...updates } : user
            ));
        }
    };

    const handleUpdateStatus = (newStatus: string) => {
        if (selectedUser) {
            setUsers(users.map(user =>
                user.id === selectedUser.id ? { ...user, status: newStatus } : user
            ));
        }
    };

    const handleDeactivateUser = (userId: string) => {
        setUserToDeactivate(userId);
        setIsDeactivateModalOpen(true);
    };

    const confirmDeactivateUser = () => {
        if (userToDeactivate) {
            setUsers(users.map(user =>
                user.id === userToDeactivate ? { ...user, status: 'Inactive' } : user
            ));
        }
        handleCloseModals();
    };

    const getStatusChip = (status: string) => {
        switch (status) {
            case 'Active':
                return 'bg-green-100 text-green-800';
            case 'Inactive':
                return 'bg-red-100 text-red-800';
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const translateStatus = (status: string) => {
        switch (status) {
            case 'Active':
                return 'Hoạt động';
            case 'Inactive':
                return 'Ngừng hoạt động';
            case 'Pending':
                return 'Chờ duyệt';
            default:
                return status;
        }
    };

    const adminUsers = users.filter(user => user.role === 'Admin' || user.role === 'Moderator');
    const regularUsers = users.filter(user => user.role === 'User');

    return (
        <Layout>
            <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                {/* <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Quản Lý Tài Khoản</h1>
                </div> */}

                {/* Bảng tài khoản quản lý */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tài khoản Quản lý</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Họ và tên</th>
                                    <th className="py-3 px-6 text-left">Tên đăng nhập</th>
                                    <th className="py-3 px-6 text-left">Email</th>
                                    <th className="py-3 px-6 text-left">Đơn vị công tác</th>
                                    <th className="py-3 px-6 text-left">Chức vụ</th>
                                    <th className="py-3 px-6 text-left">SĐT</th>
                                    <th className="py-3 px-6 text-center">Vai trò</th>
                                    <th className="py-3 px-6 text-center">Trạng thái</th>
                                    <th className="py-3 px-6 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {adminUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.username}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.email}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.workplace}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.position}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.phone}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span>{user.role}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className={`py-1 px-3 rounded-full text-xs ${getStatusChip(user.status)}`}>
                                                {translateStatus(user.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex item-center justify-center">
                                                <button
                                                    onClick={() => handleOpenManagementModal({ id: user.id, role: user.role, status: user.status })}
                                                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 mx-1">
                                                    {/* Edit Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivateUser(user.id)}
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 mx-1"
                                                    title="Ngừng hoạt động"
                                                >
                                                    {/* Delete Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Bảng tài khoản người xem */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tài khoản Người xem</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-hidden">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Tên</th>
                                    <th className="py-3 px-6 text-left">Email</th>
                                    <th className="py-3 px-6 text-center">Trạng thái</th>
                                    <th className="py-3 px-6 text-left">Đăng nhập lần cuối</th>
                                    <th className="py-3 px-6 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {regularUsers.map((user) => (
                                    <tr key={user.id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="font-medium">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.email}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className={`py-1 px-3 rounded-full text-xs ${getStatusChip(user.status)}`}>
                                                {translateStatus(user.status)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex item-center justify-center">
                                                <button
                                                    onClick={() => handleOpenStatusModal(user.id, user.status)}
                                                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 mx-1">
                                                    {/* Edit Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleDeactivateUser(user.id)}
                                                    className="w-8 h-8 rounded-full bg-red-100 text-red-600 hover:bg-red-200 mx-1"
                                                    title="Ngừng hoạt động"
                                                >
                                                    {/* Delete Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {selectedUser && isManagementModalOpen && (
                    <UpdateManagementUserModal
                        isOpen={isManagementModalOpen}
                        onClose={handleCloseModals}
                        onUpdate={handleUpdateManagementUser}
                        user={selectedUser}
                    />
                )}
                {selectedUser && isStatusModalOpen && (
                    <UpdateUserStatusModal
                        isOpen={isStatusModalOpen}
                        onClose={handleCloseModals}
                        onUpdateStatus={handleUpdateStatus}
                        currentStatus={selectedUser.status}
                    />
                )}
                <DeactivateUserModal
                    isOpen={isDeactivateModalOpen}
                    onClose={handleCloseModals}
                    onConfirm={confirmDeactivateUser}
                />
            </div>
        </Layout>
    );
};

export default UserManagement; 