# Kiểm tra Nến & Hoa

- `npm run check`: JSON mẫu hợp lệ, JavaScript đúng cú pháp, các tệp static bắt buộc tồn tại.
- HTTP preview trả về thành công; ảnh concept WebP khoảng 205 KB.
- Kiểm tra trực quan trong trình duyệt ở bố cục hẹp và khung nhúng 390 px: font tiếng Việt, tiêu đề, nút chính, ảnh vòm và dấu ngày hiển thị.
- Thắp nến đổi trạng thái nhấn, lời chúc và mở đường dẫn tiếp theo.
- Chọn hoa mở đúng lời chúc; đóng/gói lại được bằng cùng nút.
- Mở phong thư hiển thị đầy đủ nội dung trong dialog có vùng cuộn; nút đóng hoạt động.
- Nút nhạc chuyển trạng thái bật/tắt qua thao tác người xem.
- Nhập JSON với người nhận Mai đổi tên trang, tên người nhận và lời mở thư.
- Nhập JSON thiếu trường sender hiện lỗi và giữ nội dung trước đó.

Giới hạn: chưa thử trên iPhone vật lý/Safari; khung 390 px kiểm tra bố cục responsive, không mô phỏng toàn bộ hành vi Safari hay phần cứng. Khả năng chia sẻ gốc và rung tùy trình duyệt. Nhạc dùng Web Audio và cần thao tác của người xem.

Ảnh kiểm tra local nằm ở `qa/mobile-preview.png` (thư mục qa không nằm trong bản deploy).
