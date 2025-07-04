import React, { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
    children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    // Initialize collapsed state from localStorage
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        try {
            const saved = localStorage.getItem('sidebarCollapsed');
            return saved ? JSON.parse(saved) : false;
        } catch {
            return false;
        }
    });

    // Save collapsed state to localStorage when it changes
    useEffect(() => {
        localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
    }, [sidebarCollapsed]);

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />

            {/* Main content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Header
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={setSidebarCollapsed}
                />

                {/* Main content area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
                    {children}
                </main>
            </div>
        </div>
    );
};

export default Layout; 