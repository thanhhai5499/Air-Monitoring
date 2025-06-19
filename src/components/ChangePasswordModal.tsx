import React, { useState } from 'react';
import ReactDOM from 'react-dom';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    onChangePassword?: (current: string, newPass: string) => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose, onChangePassword }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
            setSuccess('');
            setIsLoading(false);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin!');
            return;
        }
        if (newPassword.length < 10) {
            setError('Mật khẩu mới phải có ít nhất 10 ký tự!');
            return;
        }
        if (!/[A-Z]/.test(newPassword)) {
            setError('Mật khẩu mới phải có ít nhất 1 ký tự in hoa!');
            return;
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)) {
            setError('Mật khẩu mới phải có ít nhất 1 ký tự đặc biệt!');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Xác nhận mật khẩu không khớp!');
            return;
        }
        setIsLoading(true);
        // Giả lập đổi mật khẩu thành công
        setTimeout(() => {
            setIsLoading(false);
            setSuccess('Đổi mật khẩu thành công!');
            if (onChangePassword) onChangePassword(currentPassword, newPassword);
            setTimeout(() => {
                onClose();
            }, 1200);
        }, 1200);
    };

    if (!isOpen) return null;
    return ReactDOM.createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm m-0 p-0">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
                <button
                    className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
                    onClick={onClose}
                    aria-label="Đóng"
                    disabled={isLoading}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Đổi mật khẩu</h2>
                <form className="space-y-5" onSubmit={handleSubmit}>
                    {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded text-sm">{error}</div>}
                    {success && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded text-sm">{success}</div>}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu hiện tại</label>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={e => setCurrentPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            placeholder="Nhập mật khẩu hiện tại"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            placeholder="Nhập mật khẩu mới"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            disabled={isLoading}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            placeholder="Nhập lại mật khẩu mới"
                        />
                    </div>
                    <div className="pt-2 flex justify-end gap-2">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md font-semibold hover:bg-gray-300 transition-colors"
                            onClick={onClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 transition-colors"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    );
};

export default ChangePasswordModal; 