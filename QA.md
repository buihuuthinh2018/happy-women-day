# Kiểm tra phiên bản chuyển cảnh

- `npm run check` chạy thành công: JSON mẫu, cú pháp hai file JavaScript và tài nguyên bắt buộc tồn tại.
- GIF nến được tạo với 36 khung hình 480 × 480, dung lượng khoảng 92 KB, có ảnh tĩnh cho chế độ giảm chuyển động.
- Cấu hình GitHub Actions chạy lại kiểm tra trước khi deploy thư mục `dist/`.

Phiên bản này thay bố cục cuộn cũ bằng các cảnh toàn màn hình, thêm hộp chào sau loading, chia trang thư và cấu hình MP3 trong JSON. Những kết quả kiểm thử giao diện của bố cục cũ không xác nhận phiên bản mới.

Giới hạn: kiểm thử tương tác trình duyệt của phiên bản mới chưa hoàn tất vì công cụ Computer Use đã dừng ở lượt trước. Chưa thử trên iPhone/Safari vật lý. Khi bổ sung MP3 thật, cần kiểm tra phát nhạc trên thiết bị đích sau nút Tiếp tục.
