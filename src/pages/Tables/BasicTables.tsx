import { useState } from "react";
import Badge from "../../components/ui/badge/Badge";
import PageMeta from "../../components/common/PageMeta";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import { createPortal } from "react-dom";

interface Account {
  id: number;
  name: string;
  username: string;
  password: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

const initialAccounts: Account[] = [
  { id: 1, name: "Nguyễn Văn A", username: "nguyenvana", password: "", email: "a@gmail.com", role: "Admin", status: "Active" },
  { id: 2, name: "Trần Thị B", username: "tranthib", password: "", email: "b@gmail.com", role: "User", status: "Inactive" },
];

export default function Tables() {
  const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const [showPasswords, setShowPasswords] = useState<{ [id: number]: boolean }>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!editingAccount) return;
    const { name, value } = e.target;
    setEditingAccount({ ...editingAccount, [name]: value });
  };

  const handleSave = () => {
    if (!editingAccount) return;
    if (isEdit) {
      setAccounts((prev) => prev.map((acc) => (acc.id === editingAccount.id ? editingAccount : acc)));
    } else {
      setAccounts((prev) => [...prev, { ...editingAccount, id: Date.now() }]);
    }
    setModalOpen(false);
  };

  const handleTogglePassword = (id: number) => {
    setShowPasswords((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <>
      <PageMeta
        title="Quản lý tài khoản"
        description="Trang quản lý tài khoản và phân quyền người dùng"
      />
      <div className="rounded-2xl border border-gray-200 bg-white p-6 w-full mt-10">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">Quản lý tài khoản</h3>
          <button
            type="button"
            onClick={() => {
              setEditingAccount({ id: 0, name: '', username: '', password: '', email: '', role: '', status: 'Active' });
              setIsEdit(false);
              setModalOpen(true);
            }}
            className="px-5 py-2 rounded-md bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors text-base"
          >
            + Thêm mới tài khoản
          </button>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 w-full">
          <div className="w-full overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Tên</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Tên đăng nhập</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Mật khẩu</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Email</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Role</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Trạng thái</th>
                  <th className="px-6 py-4 font-bold text-gray-700 text-start text-xl">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-lg">
                {accounts.map((acc) => (
                  <tr key={acc.id}>
                    <td className="px-6 py-4 text-start align-middle text-lg font-semibold text-gray-800">{acc.name}</td>
                    <td className="px-6 py-4 text-start align-middle text-lg text-gray-500">{acc.username}</td>
                    <td className="px-6 py-4 text-start align-middle text-lg text-gray-500 flex items-center gap-2">
                      {showPasswords[acc.id] ? acc.password : "•".repeat(acc.password.length || 6)}
                      <button type="button" onClick={() => handleTogglePassword(acc.id)} className="ml-2 focus:outline-none">
                        {showPasswords[acc.id] ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-start align-middle text-lg text-gray-500">{acc.email}</td>
                    <td className="px-6 py-4 text-start align-middle text-lg text-gray-500">{acc.role}</td>
                    <td className="px-6 py-4 text-start align-middle text-lg">
                      <Badge size="md" color={acc.status === "Active" ? "success" : "error"}>{acc.status}</Badge>
                    </td>
                    <td className="px-6 py-4 text-start align-middle">
                      <button
                        className="p-3 rounded-md bg-brand-500 text-white hover:bg-brand-600 transition-colors"
                        title="Cập nhật"
                        onClick={() => {
                          setEditingAccount(acc);
                          setIsEdit(true);
                          setModalOpen(true);
                        }}
                      >
                        <svg width="22" height="22" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path fillRule="evenodd" clipRule="evenodd" d="M17.0911 3.53206C16.2124 2.65338 14.7878 2.65338 13.9091 3.53206L5.6074 11.8337C5.29899 12.1421 5.08687 12.5335 4.99684 12.9603L4.26177 16.445C4.20943 16.6931 4.286 16.9508 4.46529 17.1301C4.64458 17.3094 4.90232 17.3859 5.15042 17.3336L8.63507 16.5985C9.06184 16.5085 9.45324 16.2964 9.76165 15.988L18.0633 7.68631C18.942 6.80763 18.942 5.38301 18.0633 4.50433L17.0911 3.53206ZM14.9697 4.59272C15.2626 4.29982 15.7375 4.29982 16.0304 4.59272L17.0027 5.56499C17.2956 5.85788 17.2956 6.33276 17.0027 6.62565L16.1043 7.52402L14.0714 5.49109L14.9697 4.59272ZM13.0107 6.55175L6.66806 12.8944C6.56526 12.9972 6.49455 13.1277 6.46454 13.2699L5.96704 15.6283L8.32547 15.1308C8.46772 15.1008 8.59819 15.0301 8.70099 14.9273L15.0436 8.58468L13.0107 6.55175Z" fill="currentColor" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {/* Modal thêm/sửa tài khoản */}
        {modalOpen && createPortal(
          <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-gray-400/50 backdrop-blur-[32px]">
            <div className="bg-white rounded-xl p-8 w-full max-w-md shadow-lg">
              <h4 className="text-xl font-bold mb-4 text-gray-800">{isEdit ? 'Cập nhật tài khoản' : 'Thêm mới tài khoản'}</h4>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Tên</label>
                  <input
                    type="text"
                    name="name"
                    value={editingAccount?.name || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nhập tên"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Tên đăng nhập</label>
                  <input
                    type="text"
                    name="username"
                    value={editingAccount?.username || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nhập tên đăng nhập"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Mật khẩu</label>
                  <input
                    type="password"
                    name="password"
                    value={editingAccount?.password || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nhập mật khẩu"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingAccount?.email || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nhập email"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    name="role"
                    value={editingAccount?.role || ''}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                    placeholder="Nhập vai trò (Admin/User)"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-medium text-gray-700">Trạng thái</label>
                  <select
                    name="status"
                    value={editingAccount?.status || 'Active'}
                    onChange={handleInputChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-base focus:border-brand-300 focus:ring-2 focus:ring-brand-100"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="flex justify-end gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-5 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 font-medium hover:bg-gray-50"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleSave}
                    className="px-6 py-2 rounded-lg bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
                  >
                    {isEdit ? 'Cập nhật' : 'Thêm mới'}
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </>
  );
}
