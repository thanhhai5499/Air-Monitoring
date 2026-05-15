import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import { ProtectedRouteProps } from '../types/components';

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
    const isLoggedIn = authService.isAuthenticated();
    const user = authService.getCurrentUser();
    const location = useLocation();

    // Nếu chưa đăng nhập, redirect về login
    if (!isLoggedIn) {
        return <Navigate to="/login" replace />;
    }

    // Kiểm tra nếu manager đã hết hạn
    const isManagerExpired = authService.isManagerExpired();
    if (isManagerExpired) {
        // Manager hết hạn chỉ được truy cập extension-request và my-extension-requests
        const allowedPaths = ['/extension-request', '/my-extension-requests'];
        if (!allowedPaths.includes(location.pathname)) {
            // Lấy userId từ user để redirect
            const userId = user?.id;
            if (userId) {
                return <Navigate to={`/extension-request?userId=${userId}`} replace />;
            }
            return <Navigate to="/extension-request" replace />;
        }
    } else if (user?.role === 'manager') {
        // Manager active có thể truy cập my-extension-requests để xem lịch sử
        // Không cần redirect nếu đang ở trang my-extension-requests
    }

    // Nếu là user role 3 (Google) hoặc role 'user', chỉ cho phép dashboard và statistics
    if (user?.role === 'user' || user?.role === '3') {
        if (location.pathname !== '/dashboard' && location.pathname !== '/statistics') {
            return <Navigate to="/dashboard" replace />;
        }
    }

    return <>{children}</>;
};

export default ProtectedRoute; 