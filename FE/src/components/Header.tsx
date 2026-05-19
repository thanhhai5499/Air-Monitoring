import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import UserInfoModal from './UserInfoModal';
import ChangePasswordModal from './ChangePasswordModal';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { HeaderProps } from '../types/components';

const Header: React.FC<HeaderProps> = ({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed
}) => {
    const navigate = useNavigate();
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
    const [userInfoModalOpen, setUserInfoModalOpen] = useState(false);
    const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [userInfo, setUserInfo] = useState({
        fullName: '',
        email: '',
        workplace: '',
        position: '',
        phone: '',
    });

    // Lấy user từ authService, ép kiểu cho đầy đủ trường
    const authState = authService.getAuthState();
    const user = authState.user as {
        id?: number;
        username: string | null;
        role: string;
        fullName?: string;
        email?: string;
        avatar?: string | null;
        organization?: string | null;
        position?: string | null;
        phone?: string | null;
        lastLoginAt?: string | null;
    } | undefined;

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setAccountDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        if (userInfoModalOpen) {
            const token = authService.getToken();
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || '/api/user';
            fetch(`${API_BASE_URL}/profile`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.success && data.data) {
                        setUserInfo({
                            fullName: data.data.FullName || '',
                            email: data.data.Email || '',
                            workplace: data.data.Organization || '',
                            position: data.data.Position || '',
                            phone: data.data.Phone || '',
                        });
                    }
                })
                .catch(() => {
                    setUserInfo({
                        fullName: '',
                        email: '',
                        workplace: '',
                        position: '',
                        phone: '',
                    });
                });
        }
    }, [userInfoModalOpen]);

    const handleLogout = async () => {
        try {
            await authService.logout();
            navigate('/login');
        } catch (error) {
            navigate('/login');
        }
    };

    // Hàm chuyển role sang label tiếng Việt
    const getRoleLabel = (role?: string) => {
        if (!role) return '';
        if (role === '1' || role === 'admin') return 'Quản trị viên';
        if (role === '2' || role === 'manager') return 'Quản lý';
        if (role === '3' || role === 'user') return 'Người dùng';
        return role;
    };

    // Hàm cập nhật thông tin cá nhân
    const handleUpdateProfile = async (data: {
        fullName: string;
        email: string;
        workplace: string;
        position: string;
        phone?: string;
    }) => {
        const token = authService.getToken();
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || '/api/user';
        const res = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                FullName: data.fullName,
                Email: data.email,
                Organization: data.workplace,
                Position: data.position,
                Phone: data.phone
            })
        });
        const result = await res.json();
        if (result.success) {
            toast.success('Cập nhật thông tin thành công!');
            setUserInfo({
                fullName: data.fullName,
                email: data.email,
                workplace: data.workplace,
                position: data.position,
                phone: data.phone || '',
            });
            authService.updateCurrentUser({
                fullName: data.fullName,
                email: data.email,
                organization: data.workplace,
                position: data.position,
                phone: data.phone || '',
            });
        } else {
            toast.error(result.message || 'Cập nhật thất bại!');
        }
    };

    return (
        <header className="bg-white shadow-sm">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                <div className="flex items-center">
                    {/* Mobile menu button */}
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="lg:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500"
                    >
                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>

                    {/* Desktop sidebar toggle */}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="hidden lg:inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none mr-4"
                    >
                        <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Center title */}
                <div className="flex-1 text-center">
                    <h1 className="text-lg font-bold text-black-600 hidden sm:block">
                        PHẦN MỀM HIỂN THỊ THÔNG SỐ ĐO TIA UV VÀ BỤI MỊN
                    </h1>
                    <h1 className="text-sm font-bold text-black-600 sm:hidden">
                        THÔNG SỐ TIA UV & BỤI MỊN
                    </h1>
                </div>

                <div className="flex items-center space-x-4">
                    {/* Notifications */}
                    {/* Đã xóa nút chuông thông báo ở đây */}

                    {/* User menu */}
                    <div className="relative" ref={dropdownRef}>
                        <button
                            onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                            className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                        >
                            <div className="w-8 h-8 bg-white border border-gray-300 rounded-full flex items-center justify-center overflow-hidden">
                                {user?.avatar ? (
                                    <img src={user.avatar} alt="avatar" className="w-8 h-8 object-cover rounded-full" />
                                ) : (
                                    <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                            <span className="hidden md:block text-sm font-medium text-gray-700">{user?.fullName || user?.username || 'Người dùng'}</span>
                            <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${accountDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </button>

                        {/* Dropdown Menu */}
                        {accountDropdownOpen && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
                                <div className="px-4 py-2 border-b border-gray-100">
                                    <p className="text-sm font-medium text-gray-900">{getRoleLabel(user?.role)}</p>
                                    <p className="text-sm text-gray-500">{user?.email || 'Chưa có email'}</p>
                                </div>

                                {(user?.role === 'admin' || user?.role === 'manager') && (
                                    <>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-150"
                                            onClick={() => setUserInfoModalOpen(true)}
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            <span>Thông tin</span>
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center space-x-2 transition-colors duration-150"
                                            onClick={() => setChangePasswordModalOpen(true)}
                                        >
                                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                            </svg>
                                            <span>Đổi mật khẩu</span>
                                        </button>
                                    </>
                                )}

                                <div className="border-t border-gray-100 my-1"></div>

                                <button
                                    onClick={handleLogout}
                                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors duration-150"
                                >
                                    <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    <span>Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                    <UserInfoModal
                        isOpen={userInfoModalOpen}
                        onClose={() => setUserInfoModalOpen(false)}
                        userInfo={userInfo}
                        onSave={handleUpdateProfile}
                    />
                    <ChangePasswordModal
                        isOpen={changePasswordModalOpen}
                        onClose={() => setChangePasswordModalOpen(false)}
                    />
                </div>
            </div>
            <ToastContainer position="top-center" autoClose={2000} />
        </header>
    );
};

export default Header; 
