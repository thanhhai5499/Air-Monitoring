import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    <h1 className="text-9xl font-bold text-gray-400">404</h1>
                    <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                        Trang không tồn tại
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Xin lỗi, chúng tôi không thể tìm thấy trang bạn đang tìm kiếm.
                    </p>
                </div>

                <div className="mt-8 flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:justify-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        ← Quay lại
                    </button>

                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Về trang chủ
                    </button>
                </div>

                <div className="mt-8 text-center">
                    <div className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white">
                        <svg className="h-5 w-5 text-gray-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm text-gray-600">
                            Nếu bạn cho rằng đây là lỗi, vui lòng liên hệ hỗ trợ.
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound; 