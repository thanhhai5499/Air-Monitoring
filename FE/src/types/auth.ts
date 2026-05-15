// Interfaces cho authentication system

// Request types
export interface LoginRequest {
    username: string;
    password: string;
    role?: string; // Optional since role is determined by backend
}

// Response types
export interface LoginResponse {
    token: string;
    username: string;
    role: string;
}

// Auth state types
export interface AuthState {
    isAuthenticated: boolean;
    user: {
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
        ValidFrom?: string | null;
        ValidTo?: string | null;
        status?: string | null;
    } | null;
    token: string | null;
}

// Storage keys
export const STORAGE_KEYS = {
    LOGIN_STATE: 'isLoggedIn',
    REMEMBER_ME: 'rememberMe',
    USER_INFO: 'userInfo',
    AUTH_TOKEN: 'authToken',
} as const; 