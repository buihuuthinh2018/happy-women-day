# Nến & Hoa — Thiệp 20/10

Frontend thuần HTML/CSS/JavaScript. Không cần backend, framework hoặc cài thư viện. Mỗi cảnh chiếm một màn hình; vuốt lên/xuống, dùng phím mũi tên hoặc chấm điều hướng để chuyển cảnh.

## Chạy tại máy

```sh
npm run dev
```

Mở http://localhost:5173. Trên iPhone cùng mạng Wi-Fi, dùng `http://<IP-LAN-của-máy>:5173`. Máy cần cho phép cổng 5173 qua firewall. Không mở index.html trực tiếp bằng file:// vì trình duyệt cần fetch JSON. Chia sẻ và clipboard phụ thuộc HTTPS/hỗ trợ trình duyệt; trang có thông báo thay thế.

`npm run check` kiểm tra JSON mẫu, cú pháp JavaScript, tài nguyên bắt buộc và các tình huống chuyển nhạc. `npm run build` chạy cùng kiểm tra; toàn bộ thư mục `dist/` đã là bản có thể deploy lên dịch vụ static hosting.

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

### Nhạc theo từng khoảnh khắc

Trang dùng bốn pha: `ambient` (cảnh đầu, nến, hoa), `build` (mở thư), `chorus` (trang lời nhắn trọng tâm), `outro` (phần thư sau cao trào và cảnh kết). Nhạc mẫu hiện tại được tạo riêng bằng Web Audio với bốn phối khí; không phải bản thu hoặc bản cover của **Ánh nắng của anh**.

`letter.highlight` thêm một trang lời nhắn riêng sau đoạn thư được chọn; `afterParagraph` đếm từ 0. Ví dụ `1` nghĩa là sau đoạn thứ hai. Trang nhấn được phân trang theo kích thước màn hình, tôn trọng chế độ giảm chuyển động và không ép người xem chờ nhạc mới được chuyển tiếp.

Khi có bản thu được phép sử dụng, đặt file vào `dist/assets/` rồi cấu hình:

- `music.src`: file bản thu chính.
- `music.ambientSrc`: file không lời dùng làm nền ở các cảnh đầu; để trống để dùng cùng `src`.
- `music.cues`: bốn khóa `ambient`, `build`, `chorus`, `outro`, mỗi khóa có `start` và `end` tính bằng giây. Mốc của `ambient` tính trong `ambientSrc` khi có file này; ba mốc còn lại tính trong `src`.
- `music.crossfade`: thời gian chuyển âm lượng giữa hai đoạn (0.15–4 giây), mặc định 1.1 giây. Điểm cắt cần chọn theo nhịp và theo đúng phiên bản bản thu; hệ thống không tự phát hiện điệp khúc.

Các đoạn nền lặp trong lúc chờ người xem. Đoạn `chorus` phát một lần rồi chuyển về `outro`, tránh lặp lại lời hát khi người xem đọc lâu. Vuốt về trang trước sẽ chọn lại pha tương ứng. Thay đổi pha khi đã tắt nhạc chỉ ghi nhận vị trí; không tự bật âm thanh. Nút bật lại phát từ đầu đoạn hiện tại.

`music.cues: null` giữ chế độ phát cả file liên tục (tương thích JSON cũ). Nhạc mẫu không có file vẫn dùng đủ bốn pha. Chưa đặt mốc giây cho Ánh nắng của anh vì chưa có bản thu để đo chính xác.

### Ghi nguồn cuối lá thư

`music.credit` có `title`, `performer`, `composer`, `sourceUrl`, `note`. Khi `title` có nội dung, cuối thư hiện trang ghi nguồn với liên kết nếu có. Điền thông tin đúng với bản thu thực tế; không ghi tên nghệ sĩ cho nhạc mẫu.

Trang hiện chưa chứa MP3 Ánh nắng của anh. Chỉ tải và đưa vào repo công khai file có quyền sử dụng phù hợp; ghi nguồn không thay thế giấy phép. Bản thu chính thức: https://www.youtube.com/watch?v=-GgTYmhzviw ; tham khảo hướng dẫn của YouTube về việc ghi nguồn: https://support.google.com/youtube/answer/9783148 .

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
