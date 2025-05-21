import PageMeta from "../components/common/PageMeta";

export default function UserProfiles() {
  return (
    <>
      <PageMeta
        title="Thông tin tài khoản"
        description="Trang chỉnh sửa thông tin tài khoản cá nhân"
      />
      <div className="max-w-xl mx-auto mt-10 p-8 bg-white rounded-2xl border border-gray-200 shadow">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Thông tin tài khoản</h2>
        <form className="flex flex-col gap-5">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Tên</label>
            <input type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Nhập tên" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Gmail</label>
            <input type="email" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Nhập địa chỉ Gmail" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Số điện thoại</label>
            <input type="tel" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Nhập số điện thoại" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Mật khẩu cũ</label>
            <input type="password" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Nhập mật khẩu cũ" />
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Mật khẩu mới</label>
            <input type="password" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-brand-300 focus:ring-2 focus:ring-brand-100" placeholder="Nhập mật khẩu mới" />
          </div>
          <button type="submit" className="mt-4 w-full rounded-lg bg-brand-500 py-2.5 text-white font-semibold hover:bg-brand-600 transition">Lưu thay đổi</button>
        </form>
      </div>
    </>
  );
}
