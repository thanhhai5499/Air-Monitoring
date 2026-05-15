import { LoginRequest, LoginResponse, AuthState, STORAGE_KEYS } from '../types/auth';


declare global {
    interface ImportMeta {
        env: Record<string, string>;
    }
}

export class AuthService {
    // Current auth state
    private authState: AuthState = {
        isAuthenticated: false,
        user: null,
        token: null
    };

    // Initialize auth state from storage
    constructor() {
        this.initializeAuthState();
    }

    // Login method
    async login(request: LoginRequest): Promise<LoginResponse & { message?: string }> {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_AUTH || 'http://localhost:5001';
            // Gọi API đăng nhập microservice
            const response = await fetch(`${API_BASE_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            });
            let data;
            if (!response.ok) {
                try {
                    data = await response.json();
                } catch {
                    data = {};
                }
                return {
                    token: '',
                    username: '',
                    role: '',
                    message: data.message || 'Login failed',
                    expired: data.expired || false,
                    userId: data.userId || null
                };
            }
            data = await response.json();
            // Lấy đúng token và user từ data.data
            if (data.data && data.data.token && data.data.user) {
                this.setAuthState({
                    isAuthenticated: true,
                    user: {
                        id: data.data.user.id,
                        username: data.data.user.username,
                        role: data.data.user.role,
                        fullName: data.data.user.fullName,
                        email: data.data.user.email,
                        avatar: data.data.user.avatar,
                        organization: data.data.user.organization,
                        position: data.data.user.position,
                        phone: data.data.user.phone,
                        lastLoginAt: data.data.user.lastLoginAt,
                        ValidFrom: data.data.user.ValidFrom,
                        ValidTo: data.data.user.ValidTo,
                        status: data.data.user.status
                    },
                    token: data.data.token
                });
                this.saveToStorage(false);
                return {
                    token: data.data.token,
                    username: data.data.user.username,
                    role: data.data.user.role
                };
            }
            return { token: '', username: '', role: '', message: data.message || 'Login failed' };
        } catch (error) {
            return { token: '', username: '', role: '', message: 'Login failed' };
        }
    }

    // Login Google method (legacy - use loginGoogleOAuth instead)
    async loginGoogle(request: { email: string; fullName: string; googleId: string; avatar?: string }): Promise<LoginResponse> {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_AUTH || 'http://localhost:5001';
            const response = await fetch(`${API_BASE_URL}/google-oauth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: request.googleId, // Using googleId as idToken for backward compatibility
                    email: request.email,
                    fullName: request.fullName,
                    avatar: request.avatar
                })
            });
            if (!response.ok) {
                throw new Error('Google login failed');
            }
            const data = await response.json();
            if (data.data && data.data.token && data.data.user) {
                this.setAuthState({
                    isAuthenticated: true,
                    user: {
                        id: data.data.user.id,
                        username: data.data.user.username,
                        role: data.data.user.role,
                        fullName: data.data.user.fullName,
                        email: data.data.user.email,
                        avatar: data.data.user.avatar,
                        organization: data.data.user.organization,
                        position: data.data.user.position,
                        phone: data.data.user.phone,
                        lastLoginAt: data.data.user.lastLoginAt
                    },
                    token: data.data.token
                });
                this.saveToStorage(false);
                return {
                    token: data.data.token,
                    username: data.data.user.username,
                    role: data.data.user.role
                };
            }
            return { token: '', username: '', role: '' };
        } catch (error) {
            return { token: '', username: '', role: '' };
        }
    }

    // Đăng nhập Google thực tế với id_token
    async loginGoogleOAuth(idToken: string): Promise<LoginResponse & { message?: string }> {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_AUTH || 'http://localhost:5001';
            const response = await fetch(`${API_BASE_URL}/google-oauth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ idToken })
            });
            let data;
            if (!response.ok) {
                try {
                    data = await response.json();
                } catch {
                    data = {};
                }
                return { token: '', username: '', role: '', message: data.message || 'Google OAuth login failed' };
            }
            data = await response.json();
            if (data.data && data.data.token && data.data.user) {
                // Đảm bảo role luôn là string
                const userRole = typeof data.data.user.role === 'number' ? data.data.user.role.toString() : data.data.user.role;
                this.setAuthState({
                    isAuthenticated: true,
                    user: {
                        id: data.data.user.id,
                        username: data.data.user.username,
                        role: userRole,
                        fullName: data.data.user.fullName,
                        email: data.data.user.email,
                        avatar: data.data.user.avatar,
                        organization: data.data.user.organization,
                        position: data.data.user.position,
                        phone: data.data.user.phone,
                        lastLoginAt: data.data.user.lastLoginAt
                    },
                    token: data.data.token
                });
                this.saveToStorage(false);
                return {
                    token: data.data.token,
                    username: data.data.user.username,
                    role: userRole
                };
            }
            return { token: '', username: '', role: '', message: data.message || 'Google OAuth login failed' };
        } catch (error) {
            return { token: '', username: '', role: '', message: 'Google OAuth login failed' };
        }
    }

    // Logout method
    async logout(): Promise<void> {
        try {
            // 🔄 REPLACE THIS: Call your real API logout endpoint
            // await mockLogout();
        } catch (error) {
            // Error handling without console logging
        } finally {
            // Clear auth state regardless of API response
            this.clearAuthState();
        }
    }

    // Get current auth state
    getAuthState(): AuthState {
        return { ...this.authState };
    }

    // Check if user is authenticated
    isAuthenticated(): boolean {
        return this.authState.isAuthenticated;
    }

    // Get current user
    getCurrentUser(): AuthState['user'] {
        return this.authState.user;
    }

    // Get auth token
    getToken(): string | null {
        return this.authState.token;
    }

    // Initialize auth state from storage
    private initializeAuthState(): void {
        try {
            // Check localStorage first (for remember me)
            const localStorageState = localStorage.getItem(STORAGE_KEYS.LOGIN_STATE) === 'true';
            const sessionStorageState = sessionStorage.getItem(STORAGE_KEYS.LOGIN_STATE) === 'true';

            if (localStorageState || sessionStorageState) {
                const userInfo = this.getUserInfoFromStorage();
                const token = this.getTokenFromStorage();

                this.setAuthState({
                    isAuthenticated: true,
                    user: userInfo,
                    token: token
                });
            }
        } catch (error) {
            this.clearAuthState();
        }
    }

    // Set auth state
    private setAuthState(state: AuthState): void {
        this.authState = { ...state };
    }

    // Save auth state to storage
    private saveToStorage(rememberMe: boolean): void {
        const { user, token } = this.authState;

        if (rememberMe) {
            // Save to localStorage for persistence
            localStorage.setItem(STORAGE_KEYS.LOGIN_STATE, 'true');
            localStorage.setItem(STORAGE_KEYS.REMEMBER_ME, 'true');
            if (user) localStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
            if (token) localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        } else {
            // Save to sessionStorage for current session only
            sessionStorage.setItem(STORAGE_KEYS.LOGIN_STATE, 'true');
            if (user) sessionStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(user));
            if (token) sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);

            // Clear localStorage remember me
            localStorage.removeItem(STORAGE_KEYS.REMEMBER_ME);
        }
    }

    // Get user info from storage
    private getUserInfoFromStorage(): { username: string; role: string } | null {
        try {
            const localUser = localStorage.getItem(STORAGE_KEYS.USER_INFO);
            const sessionUser = sessionStorage.getItem(STORAGE_KEYS.USER_INFO);

            const userStr = localUser || sessionUser;
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    // Get token from storage
    private getTokenFromStorage(): string | null {
        return localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
            sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    }

    // Clear auth state and storage
    private clearAuthState(): void {
        this.authState = {
            isAuthenticated: false,
            user: null,
            token: null
        };
        // Xóa từng key liên quan
        localStorage.removeItem('userInfo');
        localStorage.removeItem('authToken');
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('rememberMe');
        // Xóa toàn bộ sessionStorage
        sessionStorage.clear();
        // Xóa toàn bộ cookie
        document.cookie.split(';').forEach(function (c) {
            document.cookie = c
                .replace(/^ +/, '')
                .replace(/=.*/, '=;expires=' + new Date(0).toUTCString() + ';path=/');
        });
    }

    // Đổi mật khẩu (chỉ cho admin, manager)
    async changePassword(currentPassword: string, newPassword: string): Promise<{ success: boolean; message: string }> {
        try {
            const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
            const token = this.getToken();
            const response = await fetch(`${API_BASE_URL}/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : ''
                },
                body: JSON.stringify({ currentPassword, newPassword })
            });
            const data = await response.json();
            return { success: response.ok && data.success, message: data.message || (response.ok ? 'Success' : 'Error') };
        } catch (error) {
            return { success: false, message: 'Network error' };
        }
    }

    // Static method: handle 401 error globally
    static async handle401(response: Response) {
        if (response.status === 401) {
            // Xóa token, logout
            const auth = new AuthService();
            await auth.logout();
            // Chuyển hướng về trang đăng nhập
            window.location.href = '/login';
            return true;
        }
        return false;
    }

    // Kiểm tra xem manager có hết hạn không (dựa trên ValidTo và status)
    isManagerExpired(): boolean {
        const user = this.getCurrentUser();
        if (!user || user.role !== 'manager') {
            return false;
        }

        // Nếu status = 'pending' và có ValidTo đã hết hạn, coi là expired
        if (user.status === 'pending' && user.ValidTo) {
            const now = new Date();
            const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
            const validTo = new Date(user.ValidTo);
            return validTo < vietnamTime;
        }

        // Nếu status = 'active' nhưng ValidTo đã hết hạn, coi là expired
        if (user.status === 'active' && user.ValidTo) {
            const now = new Date();
            const vietnamTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
            const validTo = new Date(user.ValidTo);
            return validTo < vietnamTime;
        }

        return false;
    }

    // Cập nhật thông tin user hiện tại và lưu vào localStorage
    updateCurrentUser(newUser: any) {
        this.authState.user = { ...this.authState.user, ...newUser };
        // Nếu đang đăng nhập thì lưu lại vào localStorage
        if (this.authState.isAuthenticated) {
            const storageKey = STORAGE_KEYS.USER_INFO;
            const data = localStorage.getItem(storageKey);
            if (data) {
                const parsed = JSON.parse(data);
                Object.assign(parsed, newUser);
                localStorage.setItem(storageKey, JSON.stringify(parsed));
            }
        }
    }
}

// Export singleton instance
export const authService = new AuthService();

// Legacy exports for backward compatibility
export const validateLogin = async (username: string, password: string, role: string) => {
    const result = await authService.login({ username, password, role });
    return {
        token: result.token,
        username: result.username,
        role: result.role
    };
};

export const saveLoginState = () => {
    // This is now handled internally by AuthService
    // Keeping for backward compatibility
};

export const getLoginState = (): boolean => {
    return authService.isAuthenticated();
};

export const logout = async (): Promise<void> => {
    await authService.logout();
};

export const loginGoogle = async (email: string, fullName: string, googleId: string, avatar?: string) => {
    return await authService.loginGoogle({ email, fullName, googleId, avatar });
};

export const changePassword = async (currentPassword: string, newPassword: string) => {
    return await authService.changePassword(currentPassword, newPassword);
}; 