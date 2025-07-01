import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import Login from './AuthPages/Login';
import Register from './AuthPages/Register';
import Dashboard from './Pages/Dashboard';
import Statistics from './Pages/Statistics';
import Reports from './Pages/Reports';
import StationManagement from './Pages/StationManagement';
import NotFound from './Pages/NotFound';
import ProtectedRoute from './utils/ProtectedRoute';
import UserManagement from './Pages/UserManagement';

const AppRouter: React.FC = () => {
    return (
        <Routes>
            {/* Root redirect to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected Routes */}
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            <Route path="/statistics" element={
                <ProtectedRoute>
                    <Statistics />
                </ProtectedRoute>
            } />

            <Route path="/reports" element={
                <ProtectedRoute>
                    <Reports />
                </ProtectedRoute>
            } />

            <Route path="/stations" element={
                <ProtectedRoute>
                    <StationManagement />
                </ProtectedRoute>
            } />

            <Route path="/users" element={
                <ProtectedRoute>
                    <UserManagement />
                </ProtectedRoute>
            } />

            {/* Station detail route - for future use with API */}
            <Route path="/station/:stationId" element={
                <ProtectedRoute>
                    <Dashboard />
                </ProtectedRoute>
            } />

            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRouter; 