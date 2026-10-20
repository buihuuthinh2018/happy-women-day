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

Giữ `src` là chuỗi rỗng để dùng giai điệu mẫu tổng hợp bằng Web Audio. Sau khi tải xong tài nguyên, hộp chào hiện tên từ `recipient` cùng hiệu ứng pháo hoa. Bấm **Tiếp tục** để vào thiệp và bắt đầu phát nhạc theo cơ chế yêu cầu tương tác của trình duyệt. Nút tắt/bật lại nhạc treo ở góc trên; nhạc tự tạm dừng khi rời tab.

### Bản nhạc đang sử dụng

Trang dùng bản MP3 đầy đủ **Ánh nắng của anh** do người gửi cung cấp, dài khoảng 4 phút 23 giây (~4,39 MB). File nằm ở `dist/assets/anh-nang-cua-anh-full.mp3` và được sao chép nguyên vẹn từ file gốc.

Sau loading, người xem bấm **Tiếp tục** để phát từ giây 0. Bài hát chạy liên tục qua các cảnh và các trang thư, giữ nguyên âm lượng, không nhảy đoạn hoặc tự chuyển về nền kết. `music.cues` đặt là `null`, `ambientSrc` để trống và `loop` là `false` để phát một lần trọn bài. Nút tắt nhạc tạm dừng ngay tại vị trí đang nghe; bấm bật lại tiếp tục đúng vị trí đó, kể cả khi đã chuyển cảnh hoặc trang thư. Rời tab cũng tạm dừng và có thể bật lại để tiếp tục. Vị trí chỉ lưu trong bộ nhớ của lần mở trang, không lưu vào trình duyệt; tải lại hoặc mở trang mới sẽ phát từ đầu. Khi đã phát hết, bài hát không tự khởi động lại.

`letter.highlight` vẫn giữ trang lời nhắn riêng và hiệu ứng chữ. Trang này không điều khiển vị trí nhạc trong cấu hình hiện tại.

Nếu cần thay file, cập nhật `music.src`. Để `src` trống sẽ dùng nhạc mẫu Web Audio. Engine vẫn hỗ trợ cấu hình bốn pha `ambient`, `build`, `chorus`, `outro` khi cung cấp `music.cues`, nhưng bản triển khai hiện tại không sử dụng chế độ đó.

### Ghi nguồn cuối lá thư

`music.credit` có `title`, `performer`, `composer`, `sourceUrl`, `note`. Khi `title` có nội dung, cuối thư hiện trang ghi nguồn với liên kết nếu có. Điền thông tin đúng với bản thu thực tế; không ghi tên nghệ sĩ cho nhạc mẫu.

Trang ghi tên **Đức Phúc** (thể hiện), **Khắc Hưng** (sáng tác) và liên kết nguồn bản lyric **bimm** theo metadata của file người gửi cung cấp. Chỉ đưa vào repo công khai file có quyền sử dụng phù hợp; ghi nguồn không thay thế giấy phép. Tham khảo hướng dẫn của YouTube về việc ghi nguồn: https://support.google.com/youtube/answer/9783148 .

## Trải nghiệm và truy cập

- Tối ưu responsive ở 320 px trở lên, có safe-area iPhone, mục tiêu chạm lớn, không phụ thuộc hover.
- Thắp/tắt nến GIF, chọn hoa để mở lời nhắn, thư chia trang theo kích thước hiển thị. Không cuộn nội dung giữa các cảnh.
- Hộp thư hỗ trợ Escape, phím mũi tên, nút Trang trước/Trang sau và vuốt trái ở giữa tờ giấy để đi tiếp. Vuốt phải không quay trang; dùng nút Trang trước để tránh trùng thao tác điều hướng của iPhone.
- Không nhận vuốt bắt đầu ở mép màn hình (44 px), vùng đáy (88 px), trên nút/liên kết, khi đang phóng to hoặc chạm nhiều ngón. Cử chỉ hệ thống vẫn do iOS quản lý; trang web không vô hiệu hóa chuyển ứng dụng hoặc điều hướng từ mép màn hình.
- Phong bì mở nắp rồi tờ thư hiện ra; chuyển trang có hiệu ứng giấy lật 3D, mặt sau và bóng đổ. Trong lúc lật chỉ nhận một lần chuyển; nút âm thanh và đóng thư vẫn hoạt động. Đóng hoặc đổi kích thước sẽ dọn lớp hiệu ứng.
- Cảnh không hoạt động được ẩn với trình đọc màn hình và không nhận focus. Tham khảo cơ chế cử chỉ trình duyệt: [MDN touch-action](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action).
- Tôn trọng `prefers-reduced-motion`, hỗ trợ bàn phím, nhãn cho trình đọc màn hình.
- Font Google Fonts có font hệ thống dự phòng; tài nguyên nội dung và ảnh chính nằm trong source.

## Ảnh concept

`dist/assets/candles-roses.webp`: tạo bằng công cụ ImageGen tích hợp, tối ưu WebP cho web. Prompt: “Photorealistic romantic editorial still-life, blush garden roses, three ivory taper candles in vintage brass holders, deep espresso background, antique ivory cloth and scattered petals, warm candlelight, soft film grain, portrait 4:5, no people, no text, no logos.”

## Kiểm tra

Xem `QA.md` để biết kết quả kiểm tra và giới hạn thiết bị thực.

## Deploy trên GitHub Pages

Workflow `.github/workflows/pages.yml` kiểm tra mã và triển khai thư mục `dist/` khi push lên `main`. Trong Settings → Pages của repo, chọn Source **GitHub Actions**. GitHub Pages cho repo riêng tư phụ thuộc gói tài khoản; giữ nguyên quyền truy cập repo khi triển khai.

Sau khi thêm MP3 hoặc cập nhật JSON, commit và push để workflow cập nhật trang. Các tài nguyên dùng đường dẫn tương đối để hoạt động dưới `/happy-women-day/`.
