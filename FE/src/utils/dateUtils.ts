/**
 * Utility functions for date/time handling
 */

/**
 * Format date string to Vietnamese locale with proper timezone handling
 * @param dateString - ISO date string from API
 * @returns Formatted date string in Vietnamese locale
 */
export const formatToVietnameseTime = (dateString: string): string => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Dữ liệu không hợp lệ';
        }

        // Format to Vietnamese locale with timezone
        return date.toLocaleString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Lỗi định dạng thời gian';
    }
};

/**
 * Format date string assuming it's already in local time (not UTC)
 * Use this when API returns local time instead of UTC
 * @param dateString - Date string from API (assumed to be local time)
 * @returns Formatted date string in Vietnamese locale
 */
export const formatLocalTimeToVietnamese = (dateString: string): string => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Dữ liệu không hợp lệ';
        }

        // Format to Vietnamese locale without timezone conversion
        return date.toLocaleString('vi-VN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Lỗi định dạng thời gian';
    }
};

/**
 * Format date string to display exactly as API returns (no timezone conversion)
 * Use this when you want to show the exact time from API response
 * @param dateString - ISO date string from API
 * @returns Formatted date string showing exact API time
 */
export const formatExactApiTime = (dateString: string): string => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
        const date = new Date(dateString);

        // Check if date is valid
        if (isNaN(date.getTime())) {
            return 'Dữ liệu không hợp lệ';
        }

        // Extract UTC time components
        const utcHours = date.getUTCHours().toString().padStart(2, '0');
        const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');
        const utcSeconds = date.getUTCSeconds().toString().padStart(2, '0');
        const utcDay = date.getUTCDate().toString().padStart(2, '0');
        const utcMonth = (date.getUTCMonth() + 1).toString().padStart(2, '0');
        const utcYear = date.getUTCFullYear();

        return `${utcHours}:${utcMinutes}:${utcSeconds} ${utcDay}/${utcMonth}/${utcYear}`;
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Lỗi định dạng thời gian';
    }
};

/**
 * Format date-only from API (ValidFrom, ValidTo, etc.)
 * - "2026-03-08T23:59:59.000Z" -> 8/3/2026 (trích YYYY-MM-DD trước 'T')
 * - API extension-requests có formatDateForVN bug: DB 23:59 ngày 8 -> trả "2026-03-09T23:59:59+07:00"
 *   Khi isEndDate=true, trừ 1 ngày để hiển thị đúng
 */
export const formatDateOnlyNoTZ = (dateString: string | null | undefined, isEndDate = false): string => {
    if (!dateString) return 'N/A';
    try {
        const str = typeof dateString === 'string' ? dateString : String(dateString);
        const datePart = str.split('T')[0];
        if (!datePart) return 'N/A';
        const parts = datePart.split('-');
        if (parts.length < 3) return datePart;
        let y = parseInt(parts[0], 10);
        let m = parseInt(parts[1], 10);
        let d = parseInt(parts[2], 10);
        if (isNaN(d) || isNaN(m)) return datePart;
        // Workaround: BE formatDateForVN trả ngày+1 cho 23:59:59 (timezone bug)
        if (isEndDate && str.includes('23:59') && str.includes('+07:00') && d > 1) {
            const dt = new Date(y, m - 1, d);
            dt.setDate(dt.getDate() - 1);
            y = dt.getFullYear();
            m = dt.getMonth() + 1;
            d = dt.getDate();
        }
        return `${d}/${m}/${y}`;
    } catch {
        return 'N/A';
    }
};

/**
 * Format date string to Vietnamese locale (date only)
 * @param dateString - ISO date string from API
 * @returns Formatted date string in Vietnamese locale
 */
export const formatToVietnameseDate = (dateString: string): string => {
    if (!dateString) return 'Chưa có dữ liệu';
    try {
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
            return 'Dữ liệu không hợp lệ';
        }

        return date.toLocaleDateString('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Lỗi định dạng thời gian';
    }
};

/**
 * Get current time in Vietnamese timezone
 * @returns Current time string in Vietnamese format
 */
export const getCurrentVietnameseTime = (): string => {
    return new Date().toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });
};