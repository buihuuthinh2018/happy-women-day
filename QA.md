# Kiểm tra phiên bản chuyển cảnh

- `npm run check` chạy thành công: JSON mẫu, cú pháp các file JavaScript, tài nguyên bắt buộc và file nhạc được tham chiếu đều tồn tại.
- Nhạc theo vị trí đọc có 9 kiểm tra tự động: chọn pha, cấu hình mốc, chuyển âm lượng, chống tải cũ khi vuốt nhanh, giữ trạng thái tắt nhạc, xử lý mốc ngoài file, nhạc mẫu và tương thích JSON cũ.
- GIF nến được tạo với 36 khung hình 480 × 480, dung lượng khoảng 92 KB, có ảnh tĩnh cho chế độ giảm chuyển động.
- Cấu hình GitHub Actions chạy lại kiểm tra trước khi deploy thư mục `dist/`.
- Sáu kiểm tra nhận dạng cử chỉ: vùng giấy an toàn, vùng đáy, điều khiển/đa chạm/zoom, chỉ vuốt trái, loại bỏ kéo dọc/chéo/quá nhỏ và phân biệt kéo với chạm.

Kiểm tra trình duyệt Chromium/Edge trong phiên độc lập, bằng Playwright:

- 390 × 844, 375 × 667, 320 × 568, 844 × 390 và 1280 × 800: hộp chào, chuyển cảnh, thắp nến, lời chúc, phân trang thư, trang cao trào, ghi nguồn và tắt/bật nhạc đều qua kiểm tra.
- Nội dung thư vừa vùng đọc, không cuộn trang ở các kích thước trên.
- Vuốt cảm ứng tiến đúng một cảnh.
- Một file WAV gốc tạo chỉ cho kiểm thử đã được nạp và giải mã qua đường xử lý bản thu: cắt sang cao trào rồi tự chuyển về đoạn nền sau cao trào.
- Không có lỗi JavaScript trong các lượt kiểm tra này.

Bản hiện tại dùng MP3 đầy đủ, sao chép nguyên vẹn từ file người gửi cung cấp (~263,47 giây). Tên hiển thị `Tengg` và lời mở thư `Gửi Tiên…` được giữ nguyên.

Kiểm tra trình duyệt ở khung 390 × 844: không phát trước nút Tiếp tục; bắt đầu đúng giây 0; đi qua các trang thư và cảnh kết vẫn chỉ có một lần khởi tạo nguồn phát; không lặp bài, không nhảy mốc, không đổi âm lượng; nút tắt nhạc hoạt động; không có lỗi JavaScript. Các kiểm tra chuyển đoạn ở trên thuộc engine tùy chọn, không phải cấu hình hiện tại.

Kiểm tra lật thư trên Chromium/Edge và WebKit ở 390 × 844, 375 × 667, 320 × 568, 844 × 390 và 1280 × 800: vuốt trái tiến một trang; vuốt phải không quay lại; nút Trang trước hoạt động; bỏ qua mép/đáy; không nhảy nhiều trang khi chạm liên tiếp; bản sao giấy không tạo ID trùng; thư vừa vùng đọc; đóng giữa hiệu ứng rồi mở lại hoạt động. Chế độ giảm chuyển động đổi trang ngay, không tạo lớp giấy lật.

Kiểm tra cảm ứng qua Chromium CDP: vuốt trái/phải thực, quay lại bằng nút, bàn phím và đổi kích thước giữa hiệu ứng đều qua kiểm tra. WebKit desktop Windows không cung cấp Web Audio; lượt WebKit kiểm tra cử chỉ/hiển thị và thông báo dự phòng khi không phát được nhạc, không xác nhận phát MP3 trên Safari.

Giới hạn: chưa thử trên iPhone/Safari vật lý; không thể kiểm thử cử chỉ chuyển ứng dụng của iOS bằng trình duyệt desktop. Cần xác nhận thao tác mép màn hình và âm lượng trên thiết bị đích.

Cập nhật tiếp tục nhạc: tổng cộng 19 kiểm tra tự động đã qua, gồm tiếp tục tại vị trí dừng qua nhiều lần bật/tắt, chuyển cảnh khi tạm dừng, vị trí vòng lặp, thời gian còn lại gần cuối bài, không phát lại bài đã kết thúc và bật/tắt trong lúc đang giải mã.

Kiểm tra MP3 thực bằng Chromium/Edge tại 390 × 844: tạm dừng ở 1,56 giây, mở thư khi đang dừng rồi bật lại từ đúng 1,56 giây; dừng lần hai và bật từ nút ngoài thư vẫn giữ vị trí. Sự kiện ẩn tab được mô phỏng để kiểm tra tạm dừng/tiếp tục; tải lại trang phát từ giây 0. Không có lỗi JavaScript. Chưa xác nhận hành vi âm thanh trên iPhone vật lý.
