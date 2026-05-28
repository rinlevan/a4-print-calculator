# 🖨️ A4 Print Calculator (Công Cụ Tính Tiền In Ấn A4)

**A4 Print Calculator** là một ứng dụng web hiện đại, gọn nhẹ và bảo mật được thiết kế riêng cho các cửa hàng dịch vụ photocopy và in ấn. Ứng dụng giúp tự động hóa quá trình tính tiền in tài liệu từ các tệp tin tải lên (PDF, DOCX, DOC) một cách nhanh chóng và chính xác hoàn toàn offline.

---

## ✨ Tính Năng Nổi Bật

### 📂 Đọc Tài Liệu Thông Minh & Tự Động
- **Phân tích tệp tin trực tiếp**: Kéo thả toàn bộ thư mục hoặc các tệp tin lẻ (`.pdf`, `.docx`, `.doc`). Hệ thống tự động đếm số trang trên trình duyệt (client-side) mà không cần tải file lên máy chủ, đảm bảo bảo mật dữ liệu tuyệt đối.
- **Tính toán số tờ in linh hoạt**:
  - Hỗ trợ in 1 mặt / 2 mặt.
  - Hỗ trợ hướng in dọc (portrait) hoặc ngang (landscape - in 2/4 trang trên 1 tờ).
  - Tự động quy đổi từ tổng số trang sang số tờ in thực tế theo cấu hình.

### 💰 Cấu Hình Đơn Giá Đa Dạng & Trực Quan
- **Đơn giá cố định**: Nhập một đơn giá duy nhất áp dụng cho tất cả số lượng tờ in.
- **Cấu hình bậc giá theo số lượng (Tiered Pricing)**:
  - Hỗ trợ 4 bậc mặc định linh hoạt:
    - **1 - 20 tờ**: 500đ (mặc định)
    - **21 - 50 tờ**: 400đ (mặc định)
    - **51 - 99 tờ**: 350đ (mặc định)
    - **Từ 100 tờ trở lên**: 300đ (mặc định)
  - Các bậc giá có thể chỉnh sửa đơn giá tùy ý ngay tại bảng điều khiển.
  - **Nổi bật bậc giá đang hoạt động**: Tự động tô màu xanh lá (Emerald) nổi bật bậc giá đang được áp dụng tương ứng với tổng số tờ in của đơn hàng giúp người dùng dễ dàng nhận biết.

### 📚 Tính Năng Đóng Bìa Chuyên Nghiệp
- Cấu hình đóng bìa với nhiều loại bìa khác nhau:
  - Bìa trắng mỏng.
  - Bìa dày.
  - Bìa trong suốt.
  - Tùy chọn cộng thêm bọc kiếng ngoài cho bìa mỏng và bìa dày.
- Tính toán tổng chi phí đóng bìa và số lượng sách đóng bìa trực quan.

### 🧾 Xuất Hóa Đơn Khổ A6 Tiêu Chuẩn
- **Xem trước biên nhận**: Giao diện mô phỏng chính xác hóa đơn nhiệt A6 cổ điển.
- **Xuất tệp đa định dạng**:
  - **PDF chất lượng cao**: Đã được tối ưu hóa để hiển thị phông chữ rõ nét.
  - **JPG chất lượng cao**: Hỗ trợ lưu trữ và gửi qua mạng xã hội (Zalo, Messenger) tiện lợi.
- **Khắc phục triệt để lỗi oklch trong môi trường Docker**: Bộ xử lý CSS thông minh giúp thay thế các mã màu hiện đại `oklch()` thành màu tiêu chuẩn trước khi kết xuất ảnh để loại bỏ lỗi trắng trang hoặc lỗi phân tích cú pháp trên Docker.

### ⚙️ Lưu Trữ Cục Bộ (LocalStorage)
- Lưu lại cấu hình cửa hàng (tên tiệm, địa chỉ, số điện thoại), ghi chú khách hàng mặc định, và bảng giá dịch vụ in/đóng bìa tự động. Khách hàng không lo bị mất dữ liệu khi vô tình tải lại trang.

---

## 🛠️ Công Nghệ Sử Dụng

- **Core**: React 19 + TypeScript + Vite.
- **Styling**: TailwindCSS v4 (Giao diện đẹp mắt, tương thích chế độ Dark Mode/Light Mode).
- **State Management**: Zustand v5 (Quản lý trạng thái đơn hàng nhẹ nhàng và hiệu năng cao).
- **Document Parsing**: `pdfjs-dist` (Đọc PDF) và `jszip` (Đọc cấu trúc file Word).
- **Export Engines**: `html2canvas-pro` & `jsPDF` (Hỗ trợ kết xuất biên nhận hóa đơn không lỗi).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu Cầu Hệ Thống
- Đã cài đặt **Node.js (phiên bản 18 trở lên)** và **npm**
- (Tùy chọn) **Docker** & **Docker Compose** để chạy container đóng gói sẵn.

### Chạy Local (Môi Trường Phát Triển)
1. **Cài đặt các gói phụ thuộc**:
   ```bash
   npm install
   ```
2. **Khởi chạy máy chủ phát triển**:
   ```bash
   npm run dev
   ```
   *Dự án sẽ hoạt động trên cổng: [http://localhost:5173](http://localhost:5173)*

3. **Xây dựng bản thương mại (Production bundle)**:
   ```bash
   npm run build
   ```

### Chạy Bằng Docker (Nhanh chóng & Tiện lợi)
Ứng dụng có sẵn `Makefile` để tối ưu thao tác gõ lệnh:
- **Build lại Docker Image sạch**:
  ```bash
  make build
  ```
- **Khởi động dự án trên Docker**:
  ```bash
  make up
  ```
  *Dự án sẽ chạy trong Docker trên cổng: [http://localhost:3004](http://localhost:3004)*

- **Dừng Docker Container**:
  ```bash
  make down
  ```

---

## 📄 Cấu Trúc Thư Mục Chính

```
a4-print-calculator/
├── src/
│   ├── assets/             # Tài nguyên ảnh, icons
│   ├── components/         # Giao diện chính (Sidebar, InvoiceModal, FolderCard...)
│   ├── hooks/              # Custom hooks (Theme...)
│   ├── lib/                # Hàm tiện ích dùng chung
│   ├── store/              # Zustand Store quản lý trạng thái
│   ├── types/              # Khai báo TypeScript types
│   ├── utils/              # Bộ giải mã tệp (PDF, Word)
│   ├── App.tsx             # Component gốc của ứng dụng
│   └── main.tsx            # Điểm vào chính của ứng dụng
├── Dockerfile              # Dockerfile tối ưu cho Nginx
├── Makefile                # Shortcut lệnh chạy môi trường Docker
├── nginx.conf              # Cấu hình Nginx phục vụ tệp tĩnh
└── tailwind.config.js      # Cấu hình TailwindCSS
```

---

## 🤝 Giấy phép
Dự án được phát triển nhằm mục đích phục vụ tối đa hiệu suất làm việc của các cửa hàng in ấn Việt Nam. Mã nguồn mở tự do chia sẻ và tùy chỉnh.
