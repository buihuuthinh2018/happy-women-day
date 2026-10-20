# Nến & Hoa — Thiệp 20/10

Frontend thuần HTML/CSS/JavaScript. Không cần backend, framework hoặc cài thư viện. Mỗi cảnh chiếm một màn hình; vuốt lên/xuống, dùng phím mũi tên hoặc chấm điều hướng để chuyển cảnh.

## Chạy tại máy

```sh
npm run dev
```

Mở http://localhost:5173. Trên iPhone cùng mạng Wi-Fi, dùng `http://<IP-LAN-của-máy>:5173`. Máy cần cho phép cổng 5173 qua firewall. Không mở index.html trực tiếp bằng file:// vì trình duyệt cần fetch JSON. Chia sẻ và clipboard phụ thuộc HTTPS/hỗ trợ trình duyệt; trang có thông báo thay thế.

`npm run check` kiểm tra JSON mẫu, cú pháp JavaScript và các tài nguyên bắt buộc. `npm run build` chạy cùng kiểm tra; toàn bộ thư mục `dist/` đã là bản có thể deploy lên dịch vụ static hosting.

## Cá nhân hóa

Sửa `dist/greeting.json` để nội dung được áp dụng cho mọi người xem. Hoặc mở **Cá nhân hóa** cuối trang, tải JSON mẫu và nhập JSON của bạn để xem ngay. JSON nhập chỉ áp dụng trong lần xem hiện tại, không tải lên máy chủ, không được đưa vào đường dẫn chia sẻ. Để gửi bản cá nhân hóa, thay file JSON trong source rồi triển khai lại thư mục `dist/`.

Giữ nguyên cấu trúc và các trường của file mẫu:

- `recipient`, `sender`: tên người nhận và chữ ký.
- `occasion`, `date`, `year`: ngày lễ hiển thị.
- `hero`: tiêu đề, mô tả và đường dẫn ảnh bìa. Tiêu đề ngắn sẽ đẹp nhất trên điện thoại.
- `candle`: tiêu đề, hướng dẫn và lời chúc sau khi thắp nến.
- `candle.animation`, `candle.poster`: GIF nến đang cháy và ảnh nến chưa thắp. Đã có sẵn GIF 36 khung hình (~92 KB).
- `music`: nguồn MP3, âm lượng và chế độ lặp; xem ví dụ bên dưới.
- `wishes`: đúng 3 lời chúc, mỗi lời gồm `title`, `preview`, `message`.
- `letter`: `salutation`, mảng `paragraphs` (1–20 đoạn), `closing`.
- `memories`: để `[]` nếu chưa có ảnh; thêm tối đa 12 ảnh để tự hiện mục kỷ niệm.

Ví dụ mục ảnh:

```json
"memories": [
  { "image": "assets/ky-niem-01.jpg", "caption": "Một chiều thật nhiều nắng." },
  { "image": "https://example.com/anh-cua-ban.jpg", "caption": "Nhớ mãi nụ cười hôm ấy." }
]
```

Ảnh nội bộ đặt trong `dist/assets/` rồi dùng đường dẫn `assets/ten-anh.jpg`. Đường dẫn ảnh trong JSON được tính từ URL của trang, không tính từ vị trí file JSON trên máy. Ảnh URL ngoài cần truy cập được công khai. File JSON tối đa 1 MB. Nội dung văn bản được đưa vào bằng textContent để không thực thi HTML.

## Thêm nhạc MP3

Đặt file tại `dist/assets/music.mp3`, rồi thay trường `music` trong JSON:

```json
"music": {
  "src": "assets/music.mp3",
  "volume": 0.4,
  "loop": true
}
```

Giữ `src` là chuỗi rỗng để dùng giai điệu mẫu tổng hợp bằng Web Audio. Sau khi tải xong tài nguyên, hộp chào hiện tên từ `recipient` cùng hiệu ứng pháo hoa. Bấm **Tiếp tục** để vào thiệp và bắt đầu phát nhạc theo cơ chế yêu cầu tương tác của trình duyệt. Nút tắt/bật lại nhạc treo ở góc trên; nhạc tự tắt khi rời tab.

## Trải nghiệm và truy cập

- Tối ưu responsive ở 320 px trở lên, có safe-area iPhone, mục tiêu chạm lớn, không phụ thuộc hover.
- Thắp/tắt nến GIF, chọn hoa để mở lời nhắn, thư chia trang theo kích thước hiển thị. Không cuộn nội dung giữa các cảnh.
- Hộp thư hỗ trợ Escape, nút chuyển trang và vuốt ngang. Cảnh không hoạt động được ẩn với trình đọc màn hình và không nhận focus.
- Tôn trọng `prefers-reduced-motion`, hỗ trợ bàn phím, nhãn cho trình đọc màn hình.
- Font Google Fonts có font hệ thống dự phòng; tài nguyên nội dung và ảnh chính nằm trong source.

## Ảnh concept

`dist/assets/candles-roses.webp`: tạo bằng công cụ ImageGen tích hợp, tối ưu WebP cho web. Prompt: “Photorealistic romantic editorial still-life, blush garden roses, three ivory taper candles in vintage brass holders, deep espresso background, antique ivory cloth and scattered petals, warm candlelight, soft film grain, portrait 4:5, no people, no text, no logos.”

## Kiểm tra

Xem `QA.md` để biết kết quả kiểm tra và giới hạn thiết bị thực.

## Deploy trên GitHub Pages

Workflow `.github/workflows/pages.yml` kiểm tra mã và triển khai thư mục `dist/` khi push lên `main`. Trong Settings → Pages của repo, chọn Source **GitHub Actions**. GitHub Pages cho repo riêng tư phụ thuộc gói tài khoản; giữ nguyên quyền truy cập repo khi triển khai.

Sau khi thêm MP3 hoặc cập nhật JSON, commit và push để workflow cập nhật trang. Các tài nguyên dùng đường dẫn tương đối để hoạt động dưới `/happy-women-day/`.
