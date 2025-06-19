import { LoginRequest, LoginResponse, AuthState, UserInfo, STORAGE_KEYS } from '../types/auth';
import { mockLogin, mockLogout } from './mockAuthService';

// ============================================
// 🚀 TO REPLACE WITH REAL API:
// 1. Replace imports from './mockAuthService' with real API calls
// 2. Update the functions below to call your actual API endpoints
// 3. Update error handling based on your API response format
// ============================================

class AuthService {
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
    async login(request: LoginRequest): Promise<LoginResponse> {
        try {
            // 🔄 REPLACE THIS: Call your real API login endpoint
            const response = await mockLogin(request);

            if (response.success && response.data) {
                // Save auth state
                this.setAuthState({
                    isAuthenticated: true,
                    user: response.data.user || null,
                    token: response.data.token || null
                });

                // Save to storage
                this.saveToStorage(request.rememberMe || false);
            }

            return response;
        } catch (error) {
            return {
                success: false,
                message: 'Có lỗi xảy ra trong quá trình đăng nhập!'
            };
        }
    }

    // Logout method
    async logout(): Promise<void> {
        try {
            // 🔄 REPLACE THIS: Call your real API logout endpoint
            await mockLogout();
        } catch (error) {
            console.error('Logout error:', error);
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
    getCurrentUser(): UserInfo | null {
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
            console.error('Error initializing auth state:', error);
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
    private getUserInfoFromStorage(): UserInfo | null {
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
        this.setAuthState({
            isAuthenticated: false,
            user: null,
            token: null
        });

        // Clear all storage
        Object.values(STORAGE_KEYS).forEach(key => {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        });
    }
}

// Export singleton instance
export const authService = new AuthService();

// Legacy exports for backward compatibility
export const validateLogin = async (username: string, password: string) => {
    const result = await authService.login({ username, password });
    return {
        success: result.success,
        message: result.message
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