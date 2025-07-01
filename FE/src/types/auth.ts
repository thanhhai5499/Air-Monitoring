// Interfaces cho authentication system

// Request types
export interface LoginRequest {
    username: string;
    password: string;
    rememberMe?: boolean;
}

// Response types
export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
        token?: string;
        user?: UserInfo;
        expiresIn?: number;
    };
}

export interface UserInfo {
    id: string;
    username: string;
    email?: string;
    role: string;
    displayName?: string;
}

// Auth state types
export interface AuthState {
    isAuthenticated: boolean;
    user: UserInfo | null;
    token: string | null;
}

// Error types
export interface AuthError {
    code: string;
    message: string;
}

// Storage keys
export const STORAGE_KEYS = {
    LOGIN_STATE: 'isLoggedIn',
    REMEMBER_ME: 'rememberMe',
    USER_INFO: 'userInfo',
    AUTH_TOKEN: 'authToken',
} as const; 