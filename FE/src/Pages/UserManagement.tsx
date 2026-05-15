import React, { useState, useEffect } from 'react';
import { fetchManagers, fetchGoogleUsers, updateUserStatus, getExtensionRequests, approveExtensionRequest, rejectExtensionRequest } from '../services/dataApi';
import { toast } from 'react-toastify';
import Layout from '../components/Layout';
import UpdateManagementUserModal from '../components/UpdateManagementUserModal';
import UpdateUserStatusModal from '../components/UpdateUserStatusModal';
import DeactivateUserModal from '../components/DeactivateUserModal';
import DatePicker from '../components/DatePicker';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import { formatExactApiTime, formatDateOnlyNoTZ } from '../utils/dateUtils';

interface ExtensionRequest {
    Id: number;
    UserId: number;
    Description: string;
    RequestedValidFrom: string;
    RequestedValidTo: string;
    Status: string;
    AdminId: number | null;
    AdminResponse: string | null;
    CreatedAt: string;
    UpdatedAt: string;
    Username: string;
    FullName: string;
    Email: string;
    Organization: string;
    Position: string;
    Phone: string;
    ApprovedValidFrom: string | null;
    ApprovedValidTo: string | null;
}

const UserManagement: React.FC = () => {
    const [managers, setManagers] = useState<any[]>([]);
    const [googleUsers, setGoogleUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isManagementModalOpen, setIsManagementModalOpen] = useState(false);
    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<{ id: string; role: string; status: string; lastLoginAt?: string; ValidFrom?: string; ValidTo?: string } | null>(null);
    const [userToDeactivate, setUserToDeactivate] = useState<string | null>(null);
    const [extensionRequests, setExtensionRequests] = useState<ExtensionRequest[]>([]);
    const [extensionLoading, setExtensionLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<ExtensionRequest | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [adminResponse, setAdminResponse] = useState('');
    const [approvedValidFrom, setApprovedValidFrom] = useState('');
    const [approvedValidTo, setApprovedValidTo] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (!user || user.role !== 'admin') {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    useEffect(() => {
        setLoading(true);
        Promise.all([fetchManagers(), fetchGoogleUsers()])
            .then(([managersData, googleUsersData]) => {
                setManagers(managersData || []);
                setGoogleUsers(googleUsersData || []);
            })
            .finally(() => setLoading(false));
    }, []);

    const loadExtensionRequests = async () => {
        try {
            setExtensionLoading(true);
            const data = await getExtensionRequests();
            setExtensionRequests(data || []);
        } catch (error: any) {
            toast.error(error?.message || 'Không thể tải danh sách yêu cầu');
        } finally {
            setExtensionLoading(false);
        }
    };

    useEffect(() => {
        const user = authService.getCurrentUser();
        if (user?.role === 'admin') {
            loadExtensionRequests();
        }
    }, []);

    // Hàm kiểm tra và trả về status hiển thị (có tính đến ValidTo)
    const getDisplayStatus = (user: any) => {
        // Nếu có ValidTo và status là active, kiểm tra xem đã hết hạn chưa
        if (user.ValidTo && user.Status === 'active') {
            const now = new Date();
            const validTo = new Date(user.ValidTo);
            if (validTo < now) {
                return 'pending'; // Đã hết hạn -> Chờ duyệt (chờ gia hạn)
            }
        }
        return user.Status;
    };

    const handleOpenManagementModal = (user: { id: string, role: string, status: string, lastLoginAt?: string }) => {
        setSelectedUser(user);
        setIsManagementModalOpen(true);
        setIsStatusModalOpen(false);
        setIsDeactivateModalOpen(false);
    };

    const handleOpenStatusModal = (userId: string, currentStatus: string) => {
        setSelectedUser({ id: userId, status: currentStatus, role: '', lastLoginAt: '' });
        setIsStatusModalOpen(true);
        setIsManagementModalOpen(false);
        setIsDeactivateModalOpen(false);
    };

    const handleCloseModals = () => {
        setIsManagementModalOpen(false);
        setIsStatusModalOpen(false);
        setIsDeactivateModalOpen(false);
        setSelectedUser(null);
        setUserToDeactivate(null);
    };

    const handleUpdateManagementUser = async (updates: { status: string }) => {
        if (selectedUser) {
            try {
                const status = updates.status === 'active' ? 'active' : 'inactive';
                await updateUserStatus(selectedUser.id, status);
                toast.success('Cập nhật trạng thái thành công!');

                const managersData = await fetchManagers();
                setManagers(managersData || []);
                setIsManagementModalOpen(false);
            } catch (error: any) {
                const errorMessage = error?.message || 'Có lỗi xảy ra khi cập nhật';
                toast.error(errorMessage);
            }
        }
    };

    const handleUpdateStatus = async (newStatus: string) => {
        if (selectedUser) {
            try {
                // Chỉ truyền 'active' hoặc 'inactive' (chữ thường)
                const status = newStatus === 'active' ? 'active' : 'inactive';
                await updateUserStatus(selectedUser.id, status);
                setGoogleUsers(googleUsers.map(user => user.Id === selectedUser.id ? { ...user, Status: status } : user));
                setIsStatusModalOpen(false);
            } catch (error) {
                // lỗi đã được handle401 xử lý
            }
        }
    };

    const handleDeactivateUser = (userId: string) => {
        setUserToDeactivate(userId);
        setIsDeactivateModalOpen(true);
    };

    const confirmDeactivateUser = () => {
        if (userToDeactivate) {
            setManagers(managers.map(user =>
                user.id === userToDeactivate ? { ...user, status: 'Inactive' } : user
            ));
            setGoogleUsers(googleUsers.map(user =>
                user.id === userToDeactivate ? { ...user, status: 'Inactive' } : user
            ));
        }
        handleCloseModals();
    };

    const getStatusChip = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'inactive':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const translateStatus = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active':
                return 'Hoạt động';
            case 'pending':
                return 'Chờ duyệt';
            case 'inactive':
                return 'Ngừng hoạt động';
            default:
                return status;
        }
    };

    const getExtensionStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'approved':
                return 'bg-green-100 text-green-800';
            case 'rejected':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const translateExtensionStatus = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'pending':
                return 'Chờ xử lý';
            case 'approved':
                return 'Đã phê duyệt';
            case 'rejected':
                return 'Đã từ chối';
            default:
                return status;
        }
    };

    const handleApproveExtension = async () => {
        if (!selectedRequest) return;
        if (!approvedValidFrom || !approvedValidTo) {
            toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc!');
            return;
        }
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromDate = new Date(approvedValidFrom);
        fromDate.setHours(0, 0, 0, 0);
        if (fromDate < today) {
            toast.error('Ngày bắt đầu phải từ ngày hiện tại trở đi!');
            return;
        }
        const toDate = new Date(approvedValidTo);
        if (fromDate >= toDate) {
            toast.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!');
            return;
        }
        try {
            const validFromISO = `${approvedValidFrom}T00:00:00+07:00`;
            const validToISO = `${approvedValidTo}T23:59:59+07:00`;
            await approveExtensionRequest(selectedRequest.Id, adminResponse || undefined, validFromISO, validToISO);
            toast.success('Phê duyệt yêu cầu thành công!');
            setShowApproveModal(false);
            setSelectedRequest(null);
            setAdminResponse('');
            setApprovedValidFrom('');
            setApprovedValidTo('');
            loadExtensionRequests();
        } catch (error: any) {
            toast.error(error?.message || 'Có lỗi xảy ra khi phê duyệt');
        }
    };

    const handleRejectExtension = async () => {
        if (!selectedRequest) return;
        try {
            await rejectExtensionRequest(selectedRequest.Id, adminResponse || undefined);
            toast.success('Từ chối yêu cầu thành công!');
            setShowRejectModal(false);
            setSelectedRequest(null);
            setAdminResponse('');
            loadExtensionRequests();
        } catch (error: any) {
            toast.error(error?.message || 'Có lỗi xảy ra khi từ chối');
        }
    };

    return (
        <Layout>
            <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                {/* <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold text-gray-800">Quản Lý Tài Khoản</h1>
                </div> */}

                {/* Bảng tài khoản quản lý */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tài khoản Quản lý</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                                    <th className="py-3 px-6 text-center">Thời gian sử dụng</th>
                                    <th className="py-3 px-6 text-center">Đăng nhập lần cuối</th>
                                    <th className="py-3 px-6 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {managers.map((user) => (
                                    <tr key={user.Id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="font-medium">{user.FullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Username}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Email}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Organization}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Position}</span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Phone}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span>{user.Role}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            {(() => {
                                                const displayStatus = getDisplayStatus(user);
                                                return (
                                                    <span className="flex items-center justify-center gap-1.5">
                                                        <span className={`inline-block w-3 h-3 rounded-full flex-shrink-0 ${displayStatus === 'active' ? 'bg-green-500' : displayStatus === 'pending' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
                                                        <span className={`text-xs font-medium ${getStatusChip(displayStatus)} px-2 py-0.5 rounded-full`}>
                                                            {translateStatus(displayStatus)}
                                                        </span>
                                                    </span>
                                                );
                                            })()}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            {user.ValidFrom && user.ValidTo ? (
                                                <span className="text-xs">
                                                    {formatDateOnlyNoTZ(user.ValidFrom)} - {formatDateOnlyNoTZ(user.ValidTo, true)}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 text-xs">Không giới hạn</span>
                                            )}
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span>{user.lastLoginAt ? formatExactApiTime(user.lastLoginAt) : 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex item-center justify-center">
                                                <button
                                                    onClick={() => handleOpenManagementModal({ id: user.Id, role: user.Role, status: user.Status, lastLoginAt: user.lastLoginAt, ValidFrom: user.ValidFrom, ValidTo: user.ValidTo })}
                                                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 mx-1">
                                                    {/* Edit Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
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

                {/* Bảng Quản lý yêu cầu gia hạn */}
                <div className="mb-12">
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Quản lý yêu cầu gia hạn</h2>
                    {extensionLoading ? (
                        <div className="text-center py-12 bg-white shadow-md rounded-lg">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : (
                        <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Người yêu cầu</th>
                                        <th className="py-3 px-6 text-left">Email</th>
                                        <th className="py-3 px-6 text-left">Mô tả</th>
                                        <th className="py-3 px-6 text-left">Thời gian yêu cầu</th>
                                        <th className="py-3 px-6 text-center">Trạng thái</th>
                                        <th className="py-3 px-6 text-center">Ngày tạo</th>
                                        <th className="py-3 px-6 text-center">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody className="text-gray-600 text-sm font-light">
                                    {extensionRequests.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
                                                Không có yêu cầu nào
                                            </td>
                                        </tr>
                                    ) : (
                                        extensionRequests.map((request) => (
                                            <tr key={request.Id} className="border-b border-gray-200 hover:bg-gray-100">
                                                <td className="py-3 px-6 text-left">
                                                    <div>
                                                        <span className="font-medium">{request.FullName}</span>
                                                        <br />
                                                        <span className="text-xs text-gray-500">@{request.Username}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <span>{request.Email}</span>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <div className="max-w-xs truncate" title={request.Description}>
                                                        {request.Description}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-left">
                                                    <div className="text-xs">
                                                        <div>Từ: {formatDateOnlyNoTZ(request.RequestedValidFrom)}</div>
                                                        <div>Đến: {formatDateOnlyNoTZ(request.RequestedValidTo)}</div>
                                                        {request.Status === 'approved' && request.ApprovedValidFrom && request.ApprovedValidTo && (
                                                            <>
                                                                <div className="mt-1 pt-1 border-t border-gray-200">
                                                                    <div className="font-semibold text-green-600">Đã phê duyệt:</div>
                                                                    <div className="text-green-600">Từ: {formatDateOnlyNoTZ(request.ApprovedValidFrom)}</div>
                                                                    <div className="text-green-600">Đến: {formatDateOnlyNoTZ(request.ApprovedValidTo, true)}</div>
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getExtensionStatusBadge(request.Status)}`}>
                                                        {translateExtensionStatus(request.Status)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    <span className="text-xs">
                                                        {new Date(request.CreatedAt).toLocaleDateString('vi-VN')}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-6 text-center">
                                                    {request.Status === 'pending' && (
                                                        <div className="flex space-x-2 justify-center">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    const validFrom = (request.ApprovedValidFrom || request.RequestedValidFrom || '').toString().split('T')[0];
                                                                    const validTo = (request.ApprovedValidTo || request.RequestedValidTo || '').toString().split('T')[0];
                                                                    setApprovedValidFrom(validFrom);
                                                                    setApprovedValidTo(validTo);
                                                                    setShowApproveModal(true);
                                                                }}
                                                                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                                            >
                                                                Phê duyệt
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedRequest(request);
                                                                    setShowRejectModal(true);
                                                                }}
                                                                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    )}
                                                    {request.Status !== 'pending' && request.AdminResponse && (
                                                        <div className="text-xs text-gray-500">
                                                            {request.AdminResponse}
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* Bảng tài khoản người xem (Google) */}
                <div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-4">Tài khoản Người xem (Google)</h2>
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
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
                                {googleUsers.map((user) => (
                                    <tr key={user.Id} className="border-b border-gray-200 hover:bg-gray-100">
                                        <td className="py-3 px-6 text-left whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className="font-medium">{user.FullName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.Email}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <span className="flex items-center justify-center">
                                                <span className={`inline-block w-3 h-3 rounded-full ${user.Status === 'active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                            </span>
                                        </td>
                                        <td className="py-3 px-6 text-left">
                                            <span>{user.lastLoginAt ? formatExactApiTime(user.lastLoginAt) : 'N/A'}</span>
                                        </td>
                                        <td className="py-3 px-6 text-center">
                                            <div className="flex item-center justify-center">
                                                <button
                                                    onClick={() => handleOpenStatusModal(user.Id, user.Status)}
                                                    className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 mx-1">
                                                    {/* Edit Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z" />
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
                        canChangeToInactive={getDisplayStatus(selectedUser) !== 'active'}
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

                {/* Approve Extension Modal */}
                {showApproveModal && selectedRequest && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Phê duyệt yêu cầu gia hạn</h3>
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <DatePicker
                                            value={approvedValidFrom}
                                            onChange={setApprovedValidFrom}
                                            label="Từ ngày *"
                                            placeholder="dd/mm/yyyy"
                                            minDate={new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                    <div>
                                        <DatePicker
                                            value={approvedValidTo}
                                            onChange={setApprovedValidTo}
                                            label="Đến ngày *"
                                            placeholder="dd/mm/yyyy"
                                            minDate={approvedValidFrom || new Date().toISOString().split('T')[0]}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phản hồi (tùy chọn)</label>
                                    <textarea
                                        rows={3}
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Nhập phản hồi..."
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={handleApproveExtension}
                                    className="flex-1 bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600"
                                >
                                    Xác nhận phê duyệt
                                </button>
                                <button
                                    onClick={() => {
                                        setShowApproveModal(false);
                                        setSelectedRequest(null);
                                        setAdminResponse('');
                                        setApprovedValidFrom('');
                                        setApprovedValidTo('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reject Extension Modal */}
                {showRejectModal && selectedRequest && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                        <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
                            <h3 className="text-lg font-medium text-gray-900 mb-4">Từ chối yêu cầu gia hạn</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Lý do từ chối (tùy chọn)</label>
                                    <textarea
                                        rows={3}
                                        value={adminResponse}
                                        onChange={(e) => setAdminResponse(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        placeholder="Nhập lý do từ chối..."
                                    />
                                </div>
                            </div>
                            <div className="mt-4 flex space-x-2">
                                <button
                                    onClick={handleRejectExtension}
                                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600"
                                >
                                    Xác nhận từ chối
                                </button>
                                <button
                                    onClick={() => {
                                        setShowRejectModal(false);
                                        setSelectedRequest(null);
                                        setAdminResponse('');
                                    }}
                                    className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded hover:bg-gray-300"
                                >
                                    Hủy
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default UserManagement; 