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
function render(data) {
  content = data;
  document.title = `Nến & Hoa · Dành riêng cho ${data.recipient}`;
  ['recipient','sender','occasion','date','year'].forEach(key => setText(key, data[key]));
  setText('hero-eyebrow', data.hero.eyebrow); setText('title', data.hero.title); setText('highlight', data.hero.highlight); setText('hero-description', data.hero.description);
  $('hero-image').src = safeImage(data.hero.image); $('hero-image').alt = data.hero.imageAlt;
  setText('candle-title', data.candle.title); setText('candle-description', data.candle.description);
  setText('candle-status', lit ? data.candle.litMessage : 'Ngọn nến đang chờ một cái chạm từ em.');
  setText('letter-salutation', data.letter.salutation); setText('letter-closing', data.letter.closing); setText('letter-sender', data.sender);
  $('letter-paragraphs').replaceChildren(...data.letter.paragraphs.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  $('wish-grid').replaceChildren(...data.wishes.map((wish, index) => {
    const button = document.createElement('button'); button.className = 'wish'; button.setAttribute('aria-expanded','false');
    button.innerHTML = `<span class="wish-number">0${index + 1}</span>${flower(index)}<span class="wish-title"></span><span class="wish-preview"></span><span class="wish-message" id="wish-message-${index}" hidden></span><span class="wish-action">NHẬN LỜI THƯƠNG ↗</span>`;
    button.querySelector('.wish-title').textContent = wish.title; button.querySelector('.wish-preview').textContent = wish.preview; button.querySelector('.wish-message').textContent = wish.message;
    button.setAttribute('aria-controls', `wish-message-${index}`);
    button.addEventListener('click', () => {
      const expanded = button.getAttribute('aria-expanded') === 'true';
      button.setAttribute('aria-expanded', String(!expanded)); button.querySelector('.wish-message').hidden = expanded; button.querySelector('.wish-preview').hidden = !expanded;
      button.querySelector('.wish-action').textContent = expanded ? 'NHẬN LỜI THƯƠNG ↗' : 'GÓI LẠI LỜI THƯƠNG −';
      if (!expanded) petals(5);
    });
    return button;
  }));
  const memories = data.memories || [];
  $('memories').hidden = !memories.length;
  $('memory-grid').replaceChildren(...memories.map(memory => {
    const figure = document.createElement('figure'); figure.className = 'memory';
    const img = document.createElement('img'); img.src = safeImage(memory.image); img.alt = memory.caption; img.loading = 'lazy';
    img.addEventListener('error', () => { img.hidden = true; });
    const caption = document.createElement('figcaption'); caption.textContent = memory.caption; figure.append(img, caption); return figure;
  }));
}
function petals(count = 14) {
  if (reducedMotion) return;
  for (let n=0; n<count; n++) {
    const el = document.createElement('span'); el.className = 'petal'; el.style.left = `${Math.random()*90}%`; el.style.animationDelay = `${Math.random()*1.6}s`; el.style.background = ['#d4a4a6','#bb8994','#e1bcb3'][n%3]; $('petals').append(el); setTimeout(() => el.remove(), 7000);
  }
}
$('candle-toggle').addEventListener('click', () => {
  if (!content) { notify('Lời chúc đang tải. Em thử lại sau một chút nhé.'); return; }
  lit = !lit; $('candle').classList.toggle('is-lit', lit); $('candle-toggle').setAttribute('aria-pressed', String(lit)); $('candle-toggle').setAttribute('aria-label', lit ? 'Tắt ngọn nến' : 'Thắp ngọn nến');
  setText('candle-status', lit ? content.candle.litMessage : 'Ngọn nến đang chờ một cái chạm từ em.'); setText('touch-hint', lit ? 'Một ngọn nến nhỏ. Một điều ước thật lòng.' : '☝ Chạm vào nến để thắp sáng'); $('after-light').hidden = !lit;
  if (lit) { petals(); navigator.vibrate?.(25); }
});
function openLetter() { if (!content) return; $('letter-dialog').showModal(); document.body.style.overflow='hidden'; petals(9); }
$('open-letter').addEventListener('click',openLetter); $('envelope').addEventListener('click',openLetter);
$('close-letter').addEventListener('click',() => $('letter-dialog').close());
$('letter-dialog').addEventListener('close',() => {document.body.style.overflow='';});
$('letter-dialog').addEventListener('click',e => { if(e.target === $('letter-dialog')) {const r=e.target.getBoundingClientRect(); if(e.clientX<r.left || e.clientX>r.right || e.clientY<r.top || e.clientY>r.bottom) e.target.close();} });
$('json-file').addEventListener('change',async e => {
  const file = e.target.files[0]; if (!file) return;
  try { if(file.size > 1024*1024) throw Error('File JSON cần nhỏ hơn 1 MB.'); const data = validate(JSON.parse(await file.text())); render(data); notify(`Đã gói lại món quà dành cho ${data.recipient}.`); }
  catch(error) { notify(error instanceof SyntaxError ? 'JSON chưa đúng cú pháp. Hãy kiểm tra dấu ngoặc và dấu phẩy.' : error.message); }
  finally { e.target.value = ''; }
});
$('reset').addEventListener('click',() => {if(defaults){render(structuredClone(defaults));notify('Đã khôi phục nội dung mẫu.');}});
$('share').addEventListener('click',async () => {
  try {
    if (navigator.share) { await navigator.share({title:document.title,text:'Một chút hoa, một chút thương, dành cho em.',url:location.href}); }
    else if(navigator.clipboard?.writeText) {await navigator.clipboard.writeText(location.href); notify('Đã sao chép đường dẫn. Gửi cho người em thương nhé.');}
    else {notify('Sao chép địa chỉ trên trình duyệt để gửi món quà này nhé.');}
  } catch(error) {if(error.name !== 'AbortError') notify('Chưa thể chia sẻ. Em có thể sao chép địa chỉ trên trình duyệt.');}
});
// Original quiet pentatonic melody, generated locally after a user gesture.
let audio, master, musicTimer, musicPlaying=false, noteIndex=0;
const tune = [261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,392,440,523.25,659.25,523.25,392,329.63];
function soundState(playing){musicPlaying=playing;$('sound').setAttribute('aria-pressed',String(playing));$('sound').setAttribute('aria-label',playing?'Tắt giai điệu thư giãn':'Bật giai điệu thư giãn');setText('sound-label',playing?'Tắt nhạc':'Bật nhạc');}
function playNote(){
  if(!musicPlaying || !audio || audio.state !== 'running')return;
  const t=audio.currentTime; const osc=audio.createOscillator();const gain=audio.createGain();osc.type='sine';osc.frequency.value=tune[noteIndex++%tune.length];gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(.1,t+.025);gain.gain.exponentialRampToValueAtTime(.001,t+2.5);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+2.6);osc.onended=()=>{osc.disconnect();gain.disconnect();};
}
$('sound').addEventListener('click',async () => {
  $('sound').disabled=true;
  try {
    if(musicPlaying){clearInterval(musicTimer);master.gain.setTargetAtTime(0,audio.currentTime,.12);soundState(false);return;}
    if(!audio){const Context=window.AudioContext || window.webkitAudioContext;if(!Context)throw Error('Audio unavailable');audio=new Context();master=audio.createGain();master.gain.value=0;master.connect(audio.destination);}
    await audio.resume();master.gain.setTargetAtTime(.26,audio.currentTime,.25);soundState(true);playNote();musicTimer=setInterval(playNote,950);
  } catch {notify('Thiết bị chưa phát được nhạc. Em vẫn có thể tận hưởng món quà này nhé.');soundState(false);}
  finally{$('sound').disabled=false;}
});
document.addEventListener('visibilitychange',() => {if(document.hidden && musicPlaying){clearInterval(musicTimer);master.gain.setTargetAtTime(0,audio.currentTime,.1);soundState(false);}});
if(!reducedMotion && 'IntersectionObserver' in window){document.documentElement.classList.add('js-motion');const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);}}),{threshold:.12});document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));}
fetch('greeting.json').then(r=>{if(!r.ok)throw Error('Could not load greeting.json');return r.json();}).then(data=>{defaults=validate(data);render(structuredClone(defaults));}).catch(()=>notify('Chưa tải được lời chúc. Hãy mở trang qua máy chủ web và kiểm tra greeting.json.'));
