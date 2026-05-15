import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { submitExtensionRequest, getMyExtensionRequests } from '../services/dataApi';
import { toast } from 'react-toastify';
import { formatDateOnlyNoTZ } from '../utils/dateUtils';
import DatePicker from '../components/DatePicker';
import { authService } from '../services/authService';

interface ExtensionRequestItem {
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
}

const ExtensionRequest: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const userId = searchParams.get('userId');
    const expired = searchParams.get('expired');
    const isNewUser = searchParams.get('new') === '1';

    const [formData, setFormData] = useState({
        description: '',
        requestedValidFrom: '',
        requestedValidTo: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [userInfo, setUserInfo] = useState<any>(null);
    const [requests, setRequests] = useState<ExtensionRequestItem[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    useEffect(() => {
        // Yêu cầu JWT authentication - chỉ manager đã đăng nhập mới có thể truy cập
        const isAuthenticated = authService.isAuthenticated();
        const currentUser = authService.getCurrentUser();

        if (!isAuthenticated) {
            toast.error('Bạn cần đăng nhập để truy cập trang này.');
            navigate('/login');
            return;
        }

        // Chỉ cho phép manager
        if (!currentUser || currentUser.role !== 'manager') {
            toast.error('Chỉ Manager mới có thể truy cập trang này.');
            navigate('/dashboard');
            return;
        }

        // Validate userId từ URL params phải khớp với userId trong JWT token
        if (userId) {
            const userIdNum = parseInt(userId);
            const currentUserId = currentUser.id;

            if (isNaN(userIdNum) || userIdNum <= 0) {
                toast.error('Thông tin người dùng không hợp lệ.');
                navigate('/dashboard');
                return;
            }

            // Kiểm tra userId từ URL phải khớp với userId trong JWT token
            if (userIdNum !== currentUserId) {
                toast.error('Bạn chỉ có thể gửi yêu cầu gia hạn cho tài khoản của chính mình.');
                navigate('/dashboard');
                return;
            }
        }

        setUserInfo({ id: currentUser.id });

        // Load lịch sử yêu cầu gia hạn của manager
        loadRequestHistory();
    }, [userId, navigate]);

    const loadRequestHistory = async () => {
        const isAuthenticated = authService.isAuthenticated();
        if (!isAuthenticated) {
            return;
        }

        try {
            setLoadingHistory(true);
            const data = await getMyExtensionRequests();
            setRequests(data || []);
        } catch (error: any) {
            // Không hiển thị lỗi nếu chỉ là không có quyền hoặc chưa có yêu cầu nào
            if (!error?.message?.includes('401') && !error?.message?.includes('Unauthorized')) {
                console.error('Error loading request history:', error);
            }
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.description.trim()) {
            toast.error('Vui lòng nhập mô tả yêu cầu!');
            return;
        }

        if (!formData.requestedValidFrom || !formData.requestedValidTo) {
            toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc!');
            return;
        }

        // Kiểm tra từ ngày phải >= ngày hiện tại (tính từ 00:00:00 của ngày hiện tại)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const fromDate = new Date(formData.requestedValidFrom);
        fromDate.setHours(0, 0, 0, 0);
        
        if (fromDate < today) {
            toast.error('Ngày bắt đầu phải từ ngày hiện tại trở đi!');
            return;
        }

        // Kiểm tra đến ngày phải > từ ngày
        const toDate = new Date(formData.requestedValidTo);
        if (fromDate >= toDate) {
            toast.error('Ngày bắt đầu phải nhỏ hơn ngày kết thúc!');
            return;
        }

        // Kiểm tra lại authentication trước khi submit
        const isAuthenticated = authService.isAuthenticated();
        if (!isAuthenticated) {
            toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            navigate('/login');
            return;
        }

        setIsSubmitting(true);

        try {
            // Chuyển đổi date string sang ISO format với timezone VN (+07:00)
            // Giống như ExtensionRequestsManagement để đảm bảo không bị lệch ngày
            const validFromISO = `${formData.requestedValidFrom}T00:00:00+07:00`;
            const validToISO = `${formData.requestedValidTo}T23:59:59+07:00`;

            // Gọi API với JWT token (userId sẽ được lấy từ JWT token ở backend)
            await submitExtensionRequest(
                formData.description,
                validFromISO,
                validToISO
            );

            toast.success('Gửi yêu cầu gia hạn thành công! Admin sẽ xem xét và phản hồi sớm nhất.');
            setFormData({
                description: '',
                requestedValidFrom: '',
                requestedValidTo: ''
            });
            // Reload lịch sử sau khi gửi thành công
            loadRequestHistory();
        } catch (error: any) {
            toast.error(error?.message || 'Có lỗi xảy ra khi gửi yêu cầu!');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Kiểm tra authentication và role trước khi hiển thị form
    const isAuthenticated = authService.isAuthenticated();
    const currentUser = authService.getCurrentUser();

    if (!isAuthenticated || !currentUser || currentUser.role !== 'manager') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-2xl w-full space-y-8 bg-white p-8 rounded-lg shadow-lg text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Không thể truy cập</h2>
                    <p className="text-gray-600 mb-4">Bạn cần đăng nhập với tài khoản Manager để truy cập trang này.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                        Quay lại đăng nhập
                    </button>
                </div>
            </div>
        );
    }

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
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Form gửi yêu cầu */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <div className="text-center mb-6">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Yêu cầu gia hạn tài khoản</h2>
                        <p className="text-gray-600">
                            {isNewUser
                                ? 'Tài khoản của bạn đang chờ mở khóa. Vui lòng gửi yêu cầu gia hạn để Admin phê duyệt và kích hoạt tài khoản.'
                                : 'Tài khoản của bạn đã hết hạn sử dụng. Vui lòng gửi yêu cầu gia hạn để tiếp tục sử dụng hệ thống.'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                                    Mô tả yêu cầu <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="description"
                                    rows={5}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Vui lòng mô tả lý do cần gia hạn tài khoản..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <DatePicker
                                        value={formData.requestedValidFrom}
                                        onChange={(date) => setFormData({ ...formData, requestedValidFrom: date })}
                                        label="Từ ngày"
                                        placeholder="dd/mm/yyyy"
                                        minDate={new Date().toISOString().split('T')[0]} // Chỉ cho phép chọn từ ngày hiện tại trở đi
                                    />
                                </div>

                                <div>
                                    <DatePicker
                                        value={formData.requestedValidTo}
                                        onChange={(date) => setFormData({ ...formData, requestedValidTo: date })}
                                        label="Đến ngày"
                                        placeholder="dd/mm/yyyy"
                                        minDate={formData.requestedValidFrom || new Date().toISOString().split('T')[0]} // Chỉ cho phép chọn từ ngày bắt đầu trở đi
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex space-x-4">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Đang gửi...' : 'Gửi yêu cầu'}
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                            >
                                Quay lại đăng nhập
                            </button>
                        </div>
                    </form>
                </div>

                {/* Lịch sử yêu cầu gia hạn của manager */}
                <div className="bg-white p-8 rounded-lg shadow-lg">
                    <h3 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử yêu cầu gia hạn</h3>

                    {loadingHistory ? (
                        <div className="text-center py-12">
                            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="mt-2 text-gray-600">Đang tải...</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full leading-normal">
                                <thead>
                                    <tr className="bg-gray-100 text-gray-600 uppercase text-sm leading-normal">
                                        <th className="py-3 px-6 text-left">Mô tả</th>
                                        <th className="py-3 px-6 text-left">Thời gian yêu cầu</th>
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
                                            <td colSpan={7} className="py-8 text-center text-gray-500">
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
            </div>
        </div>
    );
};

export default ExtensionRequest;
