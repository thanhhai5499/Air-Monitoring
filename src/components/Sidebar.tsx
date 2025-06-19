import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface SidebarProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
    sidebarCollapsed: boolean;
    setSidebarCollapsed: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
    sidebarOpen,
    setSidebarOpen,
    sidebarCollapsed,
    setSidebarCollapsed
}) => {
    const navigate = useNavigate();
    const location = useLocation();

    const menuItems = [
        {
            name: 'Trang chủ',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v14l-5-3-5 3V5z" />
                </svg>
            ),
            path: '/dashboard'
        },
        {
            name: 'Thống kê',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            ),
            path: '/statistics'
        },
        {
            name: 'Báo cáo',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
            path: '/reports'
        },
        {
            name: 'Quản lý các trạm',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            path: '/stations'
        },
        {
            name: 'Quản Lý tài khoản',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V6a2 2 0 012-2h4a2 2 0 012 2v1m-6 0h6m-5 0l-1 1m6-1l1 1m-7 0l-1 1m8-1l1 1m-9 0V19a2 2 0 002 2h4a2 2 0 002-2V9M7 7H4a2 2 0 00-2 2v8a2 2 0 002 2h1M17 7h3a2 2 0 012 2v8a2 2 0 01-2 2h-1" />
                </svg>
            ),
            path: '/accounts'
        }
    ];

    // Check if current path matches menu item path
    const isActive = (path: string) => {
        return location.pathname === path;
    };

    return (
        <>
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 z-30 bg-gray-600 bg-opacity-75"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <div className={`fixed inset-y-0 left-0 z-40 bg-white shadow-lg transform transition-all duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                } lg:translate-x-0 lg:static lg:inset-0 ${sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
                } w-64`}>

                {/* Logo Section */}
                <div className="flex items-center justify-center h-16 bg-white border-b border-gray-200">
                    <div className="flex items-center">
                        <img
                            src="/images/logo1.png"
                            alt="Logo"
                            className={`transition-all duration-300 ${sidebarCollapsed ? 'h-10 w-10' : 'h-12 w-12'}`}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                            }}
                        />
                        {!sidebarCollapsed && (
                            <div className="ml-3">
                                <span className="text-xl font-bold text-gray-800 tracking-normal font-outfit">
                                    Air Monitoring
                                </span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Navigation */}
                <nav className="mt-5 px-2">
                    {/* Menu Label */}
                    {!sidebarCollapsed && (
                        <div className="px-3 mb-2">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                MENU
                            </p>
                        </div>
                    )}

                    {/* Menu Items */}
                    <div className="space-y-1">
                        {menuItems.map((item, index) => (
                            <div key={index} className="relative group">
                                <button
                                    onClick={() => {
                                        if (item.path) {
                                            navigate(item.path);
                                            // Close mobile sidebar after navigation
                                            if (window.innerWidth < 1024) {
                                                setSidebarOpen(false);
                                            }
                                        }
                                    }}
                                    className={`w-full flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ease-in-out ${isActive(item.path)
                                        ? 'bg-blue-50 text-blue-700 border-r-3 border-blue-600'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        } ${sidebarCollapsed ? 'justify-center' : ''}`}
                                    title={sidebarCollapsed ? item.name : ''}
                                >
                                    <div className={`flex-shrink-0 h-6 w-6 ${isActive(item.path) ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-500'
                                        }`}>
                                        {item.icon}
                                    </div>
                                    {!sidebarCollapsed && (
                                        <span className="ml-3 truncate">{item.name}</span>
                                    )}
                                </button>

                                {/* Tooltip for collapsed state */}
                                {sidebarCollapsed && (
                                    <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                                        {item.name}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </nav>

                {/* Toggle Button */}
                <div className="absolute bottom-4 left-0 right-0 px-2">
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className={`hidden lg:flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'
                            } w-full px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-all duration-200`}
                        title={sidebarCollapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
                    >
                        {!sidebarCollapsed && <span>Thu gọn</span>}
                        <svg
                            className={`w-5 h-5 transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

            </div>
        </>
    );
};

export default Sidebar; 