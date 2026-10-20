const $ = (id) => document.getElementById(id);
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
let content, defaults, lit = false, toastTimer;
const setText = (id, value) => { $(id).textContent = value; };
function notify(message) { setText('toast', message); $('toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 4500); }
function safeImage(value) {
  if (typeof value !== 'string' || !value.trim()) throw Error('Đường dẫn ảnh không hợp lệ.');
  const url = new URL(value, location.href);
  if (!['http:', 'https:'].includes(url.protocol)) throw Error('Ảnh phải là đường dẫn nội bộ hoặc URL HTTPS.');
  return url.href;
}
function validate(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error('JSON cần chứa một đối tượng thông tin.');
  const text = (value, label, limit = 10000) => { if (typeof value !== 'string' || !value.trim() || value.length > limit) throw Error(`Kiểm tra trường ${label} trong JSON.`); };
  ['recipient','sender','occasion','date','year'].forEach(key => text(data[key], key, 200));
  ['eyebrow','title','highlight','description','image','imageAlt'].forEach(key => text(data.hero?.[key], `hero.${key}`, key === 'image' ? 2000 : 1000));
  safeImage(data.hero.image);
  ['title','description','litMessage'].forEach(key => text(data.candle?.[key], `candle.${key}`, 1000));
  if (!Array.isArray(data.wishes) || data.wishes.length !== 3) throw Error('Vui lòng cung cấp đúng 3 lời chúc trong wishes.');
  data.wishes.forEach(w => ['title','preview','message'].forEach(key => text(w?.[key], `wishes.${key}`, 2000)));
  ['salutation','closing'].forEach(key => text(data.letter?.[key], `letter.${key}`, 1000));
  if (!Array.isArray(data.letter?.paragraphs) || !data.letter.paragraphs.length || data.letter.paragraphs.length > 20) throw Error('Lá thư cần từ 1 đến 20 đoạn.');
  data.letter.paragraphs.forEach(p => text(p, 'letter.paragraphs', 5000));
  if (data.memories !== undefined) {
    if (!Array.isArray(data.memories) || data.memories.length > 12) throw Error('Chỉ thêm tối đa 12 ảnh kỷ niệm.');
    data.memories.forEach(m => { text(m?.image,'memories.image',2000); text(m?.caption,'memories.caption',500); safeImage(m.image); });
  }
  return data;
}
// Small original botanical drawings; no image library or runtime dependency.
function flower(index) {
  const heads = [
    '<g transform="translate(54 38)"><ellipse rx="22" ry="19" fill="#c18a92"/><ellipse cx="-10" cy="-7" rx="13" ry="15" fill="#e3b5b8" transform="rotate(-25)"/><ellipse cx="12" cy="-5" rx="12" ry="17" fill="#dca5ac" transform="rotate(25)"/><ellipse cy="9" rx="18" ry="12" fill="#ce949c"/><path d="M-12-4Q0-20 12-3Q15 8 0 12Q-15 4-12-4" fill="#b87986"/><path d="M-8 0Q0-10 8 0Q5 10-4 7Z" fill="#e7b9bc"/><path d="M-2 0Q8-4 5 5L-1 6Z" fill="#a76675"/></g>',
    '<g transform="translate(52 37)" fill="#dfb9a9"><ellipse cy="-11" rx="9" ry="19"/><ellipse cy="-11" rx="9" ry="19" transform="rotate(60)"/><ellipse cy="-11" rx="9" ry="19" transform="rotate(120)"/><ellipse cy="-11" rx="9" ry="19" transform="rotate(180)"/><ellipse cy="-11" rx="9" ry="19" transform="rotate(240)"/><ellipse cy="-11" rx="9" ry="19" transform="rotate(300)"/><circle r="10" fill="#aa8558"/><circle r="6" fill="#cfaf75"/><g fill="#866839"><circle cx="-2" cy="-3" r="1"/><circle cx="3" cy="1" r="1"/><circle cx="-3" cy="3" r="1"/></g></g>',
    '<g transform="translate(52 42)"><path d="M-22-19Q-10-21 0-7Q9-25 23-21Q26 12 0 18Q-24 12-22-19" fill="#bb7e8b"/><path d="M0-7Q-6-27-12-23Q-22-7-5 15Q-12-4 0-7" fill="#d3a0a9"/><path d="M0-7Q8-29 15-25Q24-5 4 15Q13-3 0-7" fill="#e1b0b6"/><path d="M-5-9Q0-17 7-10Q16 5 0 17Q-16 4-5-9" fill="#cd919e"/></g>'
  ];
  return `<svg class="flower-art" viewBox="0 0 105 125" aria-hidden="true"><path d="M53 51Q46 80 54 117" stroke="#7f8865" stroke-width="2" fill="none"/><path d="M50 88Q22 89 22 67Q44 66 50 88" fill="#8d9772"/><path d="M51 100Q76 94 80 76Q56 76 51 100" fill="#a4a783"/>${heads[index]}<path d="M54 117L45 122" stroke="#7f8865" stroke-width="1"/></svg>`;
}
