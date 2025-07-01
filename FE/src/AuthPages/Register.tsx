import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        username: '',
        email: '',
        workplace: '',
        position: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeToTerms: false
    });
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Check for empty required fields
        if (!formData.fullName.trim()) {
            setError('Vui lòng nhập họ và tên!');
            return;
        }

        if (!formData.username.trim()) {
            setError('Vui lòng nhập tên đăng nhập!');
            return;
        }

        if (!formData.email.trim()) {
            setError('Vui lòng nhập email!');
            return;
        }

        if (!formData.workplace.trim()) {
            setError('Vui lòng nhập đơn vị công tác!');
            return;
        }

        if (!formData.position.trim()) {
            setError('Vui lòng nhập chức vụ!');
            return;
        }

        if (!formData.phone.trim()) {
            setError('Vui lòng nhập số điện thoại liên hệ!');
            return;
        }

        if (!formData.password.trim()) {
            setError('Vui lòng nhập mật khẩu!');
            return;
        }

        if (!formData.confirmPassword.trim()) {
            setError('Vui lòng nhập xác nhận mật khẩu!');
            return;
        }

        // Email validation - must end with @tphcm.gov.vn
        if (!formData.email.endsWith('@tphcm.gov.vn')) {
            setError('Email phải có đuôi @tphcm.gov.vn!');
            return;
        }

        // Password validation - minimum 10 characters, uppercase, special character
        if (formData.password.length < 10) {
            setError('Mật khẩu phải có ít nhất 10 ký tự!');
            return;
        }

        if (!/[A-Z]/.test(formData.password)) {
            setError('Mật khẩu phải có ít nhất 1 ký tự in hoa!');
            return;
        }

        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.password)) {
            setError('Mật khẩu phải có ít nhất 1 ký tự đặc biệt!');
            return;
        }

        // Confirm password validation
        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }

        if (!formData.agreeToTerms) {
            setError('Vui lòng đồng ý với điều khoản sử dụng!');
            return;
        }

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Mock registration success
            console.log('Registration data:', formData);
            alert('Đăng ký thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } catch (error) {
            setError('Có lỗi xảy ra trong quá trình đăng ký!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Registration Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Đăng ký</h2>
                        <p className="text-gray-600">Tạo tài khoản mới để bắt đầu sử dụng!</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Row 1: Full Name + Username */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Full Name */}
                            <div>
                                <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                                    Họ và tên <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="fullName"
                                    name="fullName"
                                    type="text"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập họ và tên"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Username */}
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                                    Tên đăng nhập <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="username"
                                    name="username"
                                    type="text"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập tên đăng nhập"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Row 2: Workplace + Position */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Workplace */}
                            <div>
                                <label htmlFor="workplace" className="block text-sm font-medium text-gray-700 mb-2">
                                    Đơn vị công tác <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="workplace"
                                    name="workplace"
                                    type="text"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập đơn vị công tác"
                                    value={formData.workplace}
                                    onChange={handleInputChange}
                                />
                            </div>

                            {/* Position */}
                            <div>
                                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                                    Chức vụ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="position"
                                    name="position"
                                    type="text"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập chức vụ hiện tại"
                                    value={formData.position}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Row: Email + Phone */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                    Email <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập email công vụ (@tphcm.gov.vn)"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                            {/* Phone */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                                    Số điện thoại liên hệ <span className="text-red-500">*</span>
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập số điện thoại liên hệ"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                Mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Mật khẩu (10+ ký tự, có in hoa và ký tự đặc biệt)"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3-3l6.364 6.364M21 21l-6.364-6.364m0 0L12 12m-3-3l3-3" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Confirm Password */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                                Xác nhận mật khẩu <span className="text-red-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    required
                                    disabled={isLoading}
                                    className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                    placeholder="Nhập lại mật khẩu"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                >
                                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        {showConfirmPassword ? (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L12 12m-3-3l6.364 6.364M21 21l-6.364-6.364m0 0L12 12m-3-3l3-3" />
                                        ) : (
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        )}
                                    </svg>
                                </button>
                            </div>
                        </div>

                        {/* Terms Agreement */}
                        <div className="flex items-center">
                            <input
                                id="agreeToTerms"
                                name="agreeToTerms"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                            />
                            <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                                Tôi đồng ý với{' '}
                                <span className="font-bold text-gray-900">
                                    điều khoản sử dụng
                                </span>
                                {' '}và{' '}
                                <span className="font-bold text-gray-900">
                                    chính sách bảo mật
                                </span>
                            </label>
                        </div>

                        {/* Submit Button */}
                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out disabled:bg-blue-300 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Đang tạo tài khoản...
                                    </>
                                ) : (
                                    'Tạo tài khoản'
                                )}
                            </button>
                        </div>

                        {/* Login Link */}
                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                Đã có tài khoản?{' '}
                                <button
                                    type="button"
                                    className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
                                    onClick={() => navigate('/login')}
                                >
                                    Đăng nhập
                                </button>
                            </span>
                        </div>
                    </form>
                </div>
            </div>

            {/* Right Side - Brand/Logo */}
            <div className="hidden lg:block relative w-0 flex-1">
                <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center overflow-hidden">
                    {/* Grid Background */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                        <img
                            src="/images/shape/grid-01.svg"
                            alt="Grid Background"
                            className="w-full h-full object-contain scale-150"
                        />
                    </div>

                    <div className="text-center relative z-10">
                        {/* Logo Image */}
                        <div className="mb-6 relative">
                            {/* Logo with enhanced styling */}
                            <div className="relative p-8 rounded-2xl backdrop-blur-sm bg-white/5 border border-white/10 shadow-2xl">
                                <img
                                    src="/images/logo.png"
                                    alt="Company Logo"
                                    className="h-24 w-auto mx-auto mb-4 drop-shadow-lg"
                                    onError={(e) => {
                                        // Fallback nếu ảnh không load được
                                        e.currentTarget.style.display = 'none';
                                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                                        if (fallback) {
                                            fallback.style.display = 'block';
                                        }
                                    }}
                                />
                                {/* Fallback text logo */}
                                <h1 className="text-5xl font-bold text-white mb-4" style={{ display: 'none' }}>
                                    <span className="text-blue-300">SHT</span>
                                    <span className="text-red-400">P</span>
                                    <span className="text-white">LABS</span>
                                </h1>
                            </div>
                        </div>
                        <div className="w-32 h-1 bg-blue-400 mx-auto rounded shadow-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register; 