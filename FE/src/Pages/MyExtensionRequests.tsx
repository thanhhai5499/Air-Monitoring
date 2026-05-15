import React, { useState, useEffect } from 'react';
import { getMyExtensionRequests } from '../services/dataApi';
import Layout from '../components/Layout';
import { formatDateOnlyNoTZ } from '../utils/dateUtils';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

interface ExtensionRequest {
    Id: number;
    Description: string;
    RequestedValidFrom: string;
    RequestedValidTo: string;
    Status: string;
    AdminResponse: string | null;
    CreatedAt: string;
    UpdatedAt: string;
    RejectedAt: string | null;
    ApprovedAt: string | null;
    AdminFullName: string | null;
    AdminUsername: string | null;
    ApprovedValidFrom: string | null;
    ApprovedValidTo: string | null;
}

const MyExtensionRequests: React.FC = () => {
    const [requests, setRequests] = useState<ExtensionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const isAuthenticated = authService.isAuthenticated();
        const user = authService.getCurrentUser();

        // Kiểm tra authentication và role trước khi load data
        if (!isAuthenticated) {
            navigate('/login', { replace: true });
            return;
        }

        // Chỉ manager mới có thể truy cập trang này để xem lịch sử của chính họ
        if (!user || user.role !== 'manager') {
            toast.error('Chỉ Manager mới có thể truy cập trang này.');
            navigate('/dashboard', { replace: true });
            return;
        }

        // Chỉ load requests khi đã authenticated và là manager
        loadRequests();
    }, [navigate]);

    const loadRequests = async () => {
        // Kiểm tra lại authentication trước khi gọi API
        const isAuthenticated = authService.isAuthenticated();
        if (!isAuthenticated) {
            toast.error('Bạn cần đăng nhập để xem lịch sử yêu cầu');
            navigate('/login', { replace: true });
            return;
        }

        try {
            setLoading(true);
            // Manager xem lịch sử yêu cầu gia hạn của chính họ
            const data = await getMyExtensionRequests();
            setRequests(data || []);
        } catch (error: any) {
            // Nếu lỗi 401, redirect về login
            if (error?.message?.includes('401') || error?.message?.includes('Unauthorized')) {
                toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
                navigate('/login', { replace: true });
                return;
            }
            toast.error(error?.message || 'Không thể tải lịch sử yêu cầu');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status: string) => {
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

    const translateStatus = (status: string) => {
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

    const formatDateTime = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        // SQL Server dùng DATEADD(HOUR, 7, GETDATE()) để lưu VN time
        // Node.js parse datetime từ SQL Server như UTC (vì DATETIME không có timezone)
        // Khi FE parse ISO string, nó cũng parse như UTC
        // Nhưng thực tế datetime đó đã là VN time (đã +7 giờ), nên cần trừ 7 giờ trước khi format
        const date = new Date(dateString);
        // Trừ 7 giờ để convert từ "VN time (được hiểu như UTC)" về UTC thực sự
        const utcDate = new Date(date.getTime() - 7 * 60 * 60 * 1000);
        // Format với timezone VN để hiển thị đúng giờ VN
        return utcDate.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Layout>
            <div className="container mx-auto p-6 bg-gray-50 min-h-screen">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Lịch sử yêu cầu gia hạn</h1>
                        <p className="text-gray-600 mt-2">Xem lịch sử các yêu cầu gia hạn tài khoản của bạn</p>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-12">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-2 text-gray-600">Đang tải...</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-md rounded-lg overflow-x-auto">
                        <table className="min-w-full leading-normal">
                            <thead>
                                <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                    <th className="py-3 px-6 text-left">Mô tả</th>
                                    <th className="py-3 px-6 text-left">Thời gian yêu cầu</th>
                                    <th className="py-3 px-6 text-left">Thời gian được phê duyệt</th>
                                    <th className="py-3 px-6 text-center">Trạng thái</th>
                                    <th className="py-3 px-6 text-left">Phản hồi từ Admin</th>
                                    <th className="py-3 px-6 text-left">Ngày xử lý</th>
                                    <th className="py-3 px-6 text-left">Người xử lý</th>
                                    <th className="py-3 px-6 text-left">Ngày tạo</th>
                                </tr>
                            </thead>
                            <tbody className="text-gray-600 text-sm font-light">
                                {requests.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="py-8 text-center text-gray-500">
                                            Bạn chưa có yêu cầu gia hạn nào
                                        </td>
                                    </tr>
                                ) : (
                                    requests.map((request) => (
                                        <tr key={request.Id} className="border-b border-gray-200 hover:bg-gray-100">
                                            <td className="py-3 px-6 text-left">
                                                <div className="max-w-xs">
                                                    {request.Description}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                <div className="text-xs">
                                                    <div>Từ: {formatDateOnlyNoTZ(request.RequestedValidFrom)}</div>
                                                    <div>Đến: {formatDateOnlyNoTZ(request.RequestedValidTo)}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                {request.Status === 'approved' && request.ApprovedValidFrom && request.ApprovedValidTo ? (
                                                    <div className="text-xs">
                                                        <div className="font-semibold text-green-600">Từ: {formatDateOnlyNoTZ(request.ApprovedValidFrom)}</div>
                                                        <div className="font-semibold text-green-600">Đến: {formatDateOnlyNoTZ(request.ApprovedValidTo, true)}</div>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Chưa phê duyệt</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-6 text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.Status)}`}>
                                                    {translateStatus(request.Status)}
                                                </span>
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                {request.AdminResponse ? (
                                                    <div className="max-w-xs text-xs">
                                                        {request.AdminResponse}
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Chưa có phản hồi</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                <div className="text-xs">
                                                    {request.Status === 'rejected' && request.RejectedAt ? (
                                                        <div>
                                                            <div className="font-semibold text-red-600">Từ chối:</div>
                                                            <div>{formatDateTime(request.RejectedAt)}</div>
                                                        </div>
                                                    ) : request.Status === 'approved' && request.ApprovedAt ? (
                                                        <div>
                                                            <div className="font-semibold text-green-600">Phê duyệt:</div>
                                                            <div>{formatDateTime(request.ApprovedAt)}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400">Chưa xử lý</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                {request.AdminFullName ? (
                                                    <span className="text-xs font-medium">{request.AdminFullName}</span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Chưa có</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-6 text-left">
                                                <span className="text-xs">
                                                    {formatDateTime(request.CreatedAt)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default MyExtensionRequests;
