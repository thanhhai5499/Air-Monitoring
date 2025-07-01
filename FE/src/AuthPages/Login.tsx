import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Login: React.FC = () => {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [keepLoggedIn, setKeepLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = await authService.login({
                username: email,
                password: password,
                rememberMe: keepLoggedIn
            });

            if (result.success) {
                console.log('Login successful, redirecting to dashboard...');
                navigate('/dashboard');
            } else {
                setError(result.message);
            }
        } catch (error) {
            setError('Có lỗi xảy ra trong quá trình đăng nhập!');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex">
            {/* Left Side - Login Form */}
            <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
                <div className="max-w-md w-full space-y-8">
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">Đăng nhập</h2>
                        <p className="text-gray-600">Nhập tên đăng nhập và mật khẩu để đăng nhập!</p>
                    </div>

                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                Tên đăng nhập <span className="text-red-500">*</span>
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="text"
                                required
                                disabled={isLoading}
                                className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
                                placeholder="Nhập tên đăng nhập"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

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
                                    placeholder="Nhập mật khẩu"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="keep-logged-in"
                                    name="keep-logged-in"
                                    type="checkbox"
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    checked={keepLoggedIn}
                                    onChange={(e) => setKeepLoggedIn(e.target.checked)}
                                />
                                <label htmlFor="keep-logged-in" className="ml-2 block text-sm text-gray-900">
                                    Ghi nhớ đăng nhập
                                </label>
                            </div>

                            <div className="text-sm">
                                <button
                                    type="button"
                                    className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
                                    onClick={() => console.log('Forgot password clicked')}
                                >
                                    Quên mật khẩu?
                                </button>
                            </div>
                        </div>

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
                                        Đang đăng nhập...
                                    </>
                                ) : (
                                    'Đăng nhập'
                                )}
                            </button>
                        </div>



                        <div className="text-center">
                            <span className="text-sm text-gray-600">
                                Chưa có tài khoản?{' '}
                                <button
                                    type="button"
                                    className="font-medium text-blue-600 hover:text-blue-500 underline bg-transparent border-none cursor-pointer"
                                    onClick={() => navigate('/register')}
                                >
                                    Đăng ký
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

export default Login; 