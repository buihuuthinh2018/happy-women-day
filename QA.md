# Kiểm tra phiên bản chuyển cảnh

- `npm run check` chạy thành công: JSON mẫu, cú pháp các file JavaScript, tài nguyên bắt buộc và file nhạc được tham chiếu đều tồn tại.
- Nhạc theo vị trí đọc có 9 kiểm tra tự động: chọn pha, cấu hình mốc, chuyển âm lượng, chống tải cũ khi vuốt nhanh, giữ trạng thái tắt nhạc, xử lý mốc ngoài file, nhạc mẫu và tương thích JSON cũ.
- GIF nến được tạo với 36 khung hình 480 × 480, dung lượng khoảng 92 KB, có ảnh tĩnh cho chế độ giảm chuyển động.
- Cấu hình GitHub Actions chạy lại kiểm tra trước khi deploy thư mục `dist/`.

Kiểm tra trình duyệt Chromium/Edge trong phiên độc lập, bằng Playwright:

- 390 × 844, 375 × 667, 320 × 568, 844 × 390 và 1280 × 800: hộp chào, chuyển cảnh, thắp nến, lời chúc, phân trang thư, trang cao trào, ghi nguồn và tắt/bật nhạc đều qua kiểm tra.
- Nội dung thư vừa vùng đọc, không cuộn trang ở các kích thước trên.
- Vuốt cảm ứng tiến đúng một cảnh.
- Một file WAV gốc tạo chỉ cho kiểm thử đã được nạp và giải mã qua đường xử lý bản thu: cắt sang cao trào rồi tự chuyển về đoạn nền sau cao trào.
- Không có lỗi JavaScript trong các lượt kiểm tra này.

Bản hiện tại dùng MP3 đầy đủ, sao chép nguyên vẹn từ file người gửi cung cấp (~263,47 giây). Tên hiển thị `Tengg` và lời mở thư `Gửi Tiên…` được giữ nguyên.

Kiểm tra trình duyệt ở khung 390 × 844: không phát trước nút Tiếp tục; bắt đầu đúng giây 0; đi qua các trang thư và cảnh kết vẫn chỉ có một lần khởi tạo nguồn phát; không lặp bài, không nhảy mốc, không đổi âm lượng; nút tắt nhạc hoạt động; không có lỗi JavaScript. Các kiểm tra chuyển đoạn ở trên thuộc engine tùy chọn, không phải cấu hình hiện tại.

Giới hạn: chưa thử trên iPhone/Safari vật lý; cần nghe thử âm lượng trên thiết bị đích.
