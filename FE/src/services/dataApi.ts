import { authService, AuthService } from './authService';

// ==== USER SERVICE APIs (ADMIN ONLY) ====
let API_BASE_URL_USER = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';

// Lấy dữ liệu trung bình các sensor từ 3 trạm trong ngày hiện tại
export const fetchAverageDayData = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/average-day`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
};

export async function fetchSensorLatestData() {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const res = await fetch(`${API_BASE_URL}/sensor-latest`, {
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
    });
    if (await AuthService.handle401(res)) return { data: [] };
    if (!res.ok) throw new Error('Failed to fetch sensor latest data');
    const data = await res.json();
    return data.data;
}

export const fetchStationsList = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/list`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

// Lấy danh sách trạm chi tiết với thông tin sensors và dữ liệu cập nhật gần nhất
export const fetchStationsDetailedList = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/detailed-list`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

// Lấy thông tin chi tiết của một trạm cụ thể
export const fetchStationDetails = async (stationId: string | number) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/${stationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

export const fetchStationDailyStatistics = async (stationId: string) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATISTICS || 'http://localhost:5007';
    const response = await fetch(`${API_BASE_URL}/daily?stationId=${stationId}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data ?? data;
};

export const fetchStationMonthlyStatistics = async (stationId: string, year?: number) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATISTICS || 'http://localhost:5007';
    const yearParam = year !== undefined ? `&year=${year}` : '';
    const response = await fetch(`${API_BASE_URL}/monthly?stationId=${stationId}${yearParam}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data ?? data;
};

export const fetchStationSensors = async (stationId?: string | number) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_REPORT || 'http://localhost:5005';
    let url = `${API_BASE_URL}/station-sensors`;
    if (stationId) {
        url += `?stationId=${stationId}`;
    }
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

export const fetchReportFilter = async (params: {
    stationId: string | number,
    fromDate: string,
    toDate: string,
    dataType: string,
    viewType: string
}) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_REPORT || 'http://localhost:5005';
    const response = await fetch(`${API_BASE_URL}/filter`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(params)
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

// Lấy danh sách các loại sensor (sensor types)
export const fetchSensorTypes = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_REPORT || 'http://localhost:5005';
    const response = await fetch(`${API_BASE_URL}/sensor-types`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

export const fetchSensorThresholds = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/sensor-thresholds`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
};

// Thêm sensor (SensorType)
export const createSensor = async (data: { name: string; description?: string; unit: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/sensor`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()).data;
};

// Cập nhật sensor (SensorType)
export const updateSensor = async (id: number, data: { name: string; description?: string; unit: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/sensor/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()).data;
};

// Thêm sensor threshold
export const createSensorThreshold = async (data: { sensorTypeId: number; level: number; minValue: number; maxValue?: number | null; color: string; description?: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/sensor-threshold`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()).data;
};

// Cập nhật sensor threshold
export const updateSensorThreshold = async (id: number, data: { sensorTypeId: number; level: number; minValue: number; maxValue?: number | null; color: string; description?: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/sensor-threshold/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `HTTP error! status: ${response.status}`);
    }
    return (await response.json()).data;
};

export const fetchManagers = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/managers`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) throw new Error('Failed to fetch managers');
    const data = await response.json();
    return data.data;
};

export const fetchGoogleUsers = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/google`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) throw new Error('Failed to fetch google users');
    const data = await response.json();
    return data.data;
};

export const updateUserStatus = async (id: number | string, status: 'active' | 'inactive') => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/${id}/status`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status })
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to update user status');
    return await response.json();
};

// ==== EXTENSION REQUESTS APIs ====
// Manager gửi yêu cầu gia hạn (yêu cầu JWT token)
export const submitExtensionRequest = async (description: string, requestedValidFrom: string, requestedValidTo: string) => {
    const token = authService.getToken();
    if (!token) {
        throw new Error('Bạn cần đăng nhập để gửi yêu cầu gia hạn');
    }
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/extension-requests`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ description, requestedValidFrom, requestedValidTo })
    });
    if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || text || `HTTP error! status: ${response.status}`);
        } catch (e) {
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }
    }
    return await response.json();
};

// Admin xem danh sách yêu cầu gia hạn
export const getExtensionRequests = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/extension-requests`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to fetch extension requests');
    const data = await response.json();
    return data.data;
};

// Admin approve yêu cầu gia hạn
export const approveExtensionRequest = async (requestId: number, adminResponse?: string, approvedValidFrom?: string, approvedValidTo?: string) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/extension-requests/${requestId}/approve`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ adminResponse, approvedValidFrom, approvedValidTo })
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || text || `HTTP error! status: ${response.status}`);
        } catch (e) {
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }
    }
    return await response.json();
};

// Admin reject yêu cầu gia hạn
export const rejectExtensionRequest = async (requestId: number, adminResponse?: string) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/extension-requests/${requestId}/reject`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ adminResponse })
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            throw new Error(errorData.message || text || `HTTP error! status: ${response.status}`);
        } catch (e) {
            throw new Error(text || `HTTP error! status: ${response.status}`);
        }
    }
    return await response.json();
};

// Manager xem lịch sử yêu cầu gia hạn của mình
export const getMyExtensionRequests = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_USER || 'http://localhost:5002';
    const response = await fetch(`${API_BASE_URL}/extension-requests/my-requests`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to fetch my extension requests');
    const data = await response.json();
    return data.data;
};

// ==== NEWS APIs ====
export const fetchNewsList = async () => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/news`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return [];
    if (!response.ok) throw new Error('Failed to fetch news list');
    const data = await response.json();
    return data.data;
};

export const createNews = async (news: { title: string; summary?: string; content: string; image?: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/news`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(news)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to create news');
    return await response.json();
};

export const updateNews = async (id: number, news: { title: string; summary?: string; content: string; image?: string }) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(news)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to update news');
    return await response.json();
};

export const deleteNews = async (id: number) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/news/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) throw new Error('Failed to delete news');
    return await response.json();
};

// ==== UPLOAD IMAGE API ====
export const uploadNewsImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_DATA || 'http://localhost:5004';
    const response = await fetch(`${API_BASE_URL}/image`, {
        method: 'POST',
        body: formData
    });
    if (!response.ok) throw new Error('Upload ảnh thất bại');
    const data = await response.json();
    return data.url;
};

// Thêm mới trạm (Station)
export const createStation = async (data: any) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    // Đảm bảo luôn có dấu / ở cuối để tránh lỗi redirect 301
    const url = API_BASE_URL.endsWith('/') ? API_BASE_URL : API_BASE_URL + '/';
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            // Chỉ lấy message từ JSON, không lấy toàn bộ object
            const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        } catch (e: any) {
            // Nếu parse JSON fail, thử extract message từ text nếu có
            if (e instanceof SyntaxError) {
                // Nếu text là JSON string nhưng parse fail, thử lại
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || text);
                } catch {
                    throw new Error(text || `HTTP error! status: ${response.status}`);
                }
            } else {
                // Nếu đã là Error object rồi thì throw lại
                throw e;
            }
        }
    }
    return (await response.json()).data;
};

// Cập nhật trạm (Station)
export const updateStation = async (id: number | string, data: any) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATION || 'http://localhost:5006';
    const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        const text = await response.text();
        try {
            const errorData = JSON.parse(text);
            // Chỉ lấy message từ JSON, không lấy toàn bộ object
            const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
            throw new Error(errorMessage);
        } catch (e: any) {
            // Nếu parse JSON fail, thử extract message từ text nếu có
            if (e instanceof SyntaxError) {
                // Nếu text là JSON string nhưng parse fail, thử lại
                try {
                    const errorData = JSON.parse(text);
                    throw new Error(errorData.message || text);
                } catch {
                    throw new Error(text || `HTTP error! status: ${response.status}`);
                }
            } else {
                // Nếu đã là Error object rồi thì throw lại
                throw e;
            }
        }
    }
    return (await response.json()).data;
};

// ==== STATISTICS APIs - NEW ====

// Lấy dữ liệu theo giờ (Heat Map)
export const fetchHourlyStatistics = async (stationId: string | number, sensorType: string = 'PM2.5', days: number = 7) => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATISTICS || 'http://localhost:5007';
    const response = await fetch(`${API_BASE_URL}/hourly?stationId=${stationId}&sensorType=${sensorType}&days=${days}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || result;
};

// Lấy phân bố mức độ chất lượng (Doughnut Chart)
export const fetchDistribution = async (stationId: string | number, sensorType: string = 'PM2.5', period: string = 'month') => {
    const token = authService.getToken();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL_STATISTICS || 'http://localhost:5007';
    const response = await fetch(`${API_BASE_URL}/distribution?stationId=${stationId}&sensorType=${sensorType}&period=${period}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
    });
    if (await AuthService.handle401(response)) return null;
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json();
    return result.data || result;
}; 