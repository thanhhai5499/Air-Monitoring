# Hệ Thống Giám Sát Không Khí

Một bảng điều khiển hiện đại được xây dựng với React và Tailwind CSS, cung cấp giao diện trực quan để theo dõi và phân tích dữ liệu chất lượng không khí.

## Tổng Quan

Hệ thống giám sát không khí là một ứng dụng web giúp thu thập, hiển thị và phân tích dữ liệu từ các cảm biến chất lượng không khí. Ứng dụng được xây dựng trên các công nghệ hiện đại:

- React 19
- TypeScript
- Tailwind CSS v4
- Vite

## Tính Năng

- **Bảng Điều Khiển Trực Quan**: Hiển thị dữ liệu theo thời gian thực từ nhiều cảm biến
- **Biểu Đồ & Đồ Thị**: Theo dõi các xu hướng và thay đổi chất lượng không khí
- **Điều Hướng Thuận Tiện**: Sidebar có thể thu gọn giúp tối ưu không gian hiển thị
- **Hỗ Trợ Thiết Bị Di Động**: Giao diện thích ứng với mọi kích thước màn hình
- **Tùy Chỉnh Dễ Dàng**: Các component được thiết kế để dễ dàng tùy biến và mở rộng

## Cài Đặt

### Yêu Cầu Hệ Thống

- Node.js 18.x trở lên (khuyến nghị sử dụng Node.js 20.x trở lên)

### Hướng Dẫn Cài Đặt

1. Clone repository:

   ```bash
   git clone <URL repository của bạn>
   ```

2. Cài đặt các gói phụ thuộc:

   ```bash
   npm install
   ```

   Nếu gặp vấn đề, hãy thử với cờ `--legacy-peer-deps`:

   ```bash
   npm install --legacy-peer-deps
   ```

3. Khởi động server phát triển:
   ```bash
   npm run dev
   ```

## Cấu Trúc Dự Án

```
/
├── public/          # Tài nguyên tĩnh: hình ảnh, logo, favicon
├── src/
│   ├── components/  # Các component React có thể tái sử dụng
│   ├── context/     # Context API cho quản lý state
│   ├── hooks/       # Custom React hooks
│   ├── icons/       # SVG icons
│   ├── layout/      # Components bố cục: sidebar, header, layout chính
│   └── pages/       # Các trang của ứng dụng
└── ...
```

## Sử Dụng

Hệ thống cung cấp các chức năng phổ biến:

- Xem dữ liệu chất lượng không khí theo thời gian thực
- Phân tích xu hướng thông qua biểu đồ
- Quản lý thiết bị cảm biến
- Cài đặt cảnh báo khi chất lượng không khí vượt ngưỡng

## Các Thành Phần

Dự án bao gồm nhiều thành phần UI tiên tiến:

- Sidebar có thể thu gọn và mở rộng
- Biểu đồ dữ liệu tương tác (Line và Bar charts)
- Bảng dữ liệu với các tính năng sắp xếp
- Forms và các thành phần nhập liệu
- Thông báo, dropdown menus, modals
- Các thành phần UI khác: buttons, badges, alerts...

## Phát Triển

### Lệnh Hữu Ích

- `npm run dev` - Khởi động server phát triển
- `npm run build` - Build ứng dụng cho môi trường production
- `npm run lint` - Kiểm tra lỗi với ESLint
- `npm run preview` - Xem trước phiên bản build

## Giấy Phép

Dự án này được phát hành theo giấy phép MIT.
