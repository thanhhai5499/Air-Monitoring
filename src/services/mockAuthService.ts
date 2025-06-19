import { LoginRequest, LoginResponse, UserInfo } from '../types/auth';

// Mock user database
const MOCK_USERS: Record<string, UserInfo & { password: string }> = {
    admin: {
        id: '1',
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin1122',
        role: 'administrator',
        displayName: 'Quản trị viên'
    }
};

// Simulate API delay
const simulateApiDelay = (ms: number = 1000): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// Mock login service
export const mockLogin = async (request: LoginRequest): Promise<LoginResponse> => {
    // Simulate API call delay
    await simulateApiDelay(1000);

    const { username, password } = request;
    const user = MOCK_USERS[username];

    // Validate credentials
    if (!user || user.password !== password) {
        return {
            success: false,
            message: 'Tên đăng nhập hoặc mật khẩu không đúng!'
        };
    }

    // Generate mock token
    const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Return success response
    return {
        success: true,
        message: 'Đăng nhập thành công!',
        data: {
            token: mockToken,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                displayName: user.displayName
            },
            expiresIn: 3600 // 1 hour
        }
    };
};

// Mock logout service
export const mockLogout = async (): Promise<{ success: boolean; message: string }> => {
    // Simulate API call delay
    await simulateApiDelay(500);

    return {
        success: true,
        message: 'Đăng xuất thành công!'
    };
};

