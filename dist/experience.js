let scenes=[],sceneIndex=0,transitioning=false,started=false,assetUrls=new Map(),assetFailures=[],memoryIndex=0;
let readerPages=[],readerIndex=0,readerKind='',readerHeading='',readerClosing='';
let musicPlaying=false,audioContext,master,musicTimer,noteIndex=0,musicElement,musicBusy=false;
let fireworksFrame,fireworksTimer,resizeTimer;
const sceneNames={home:'Lời mở đầu',candle:'Ngọn nến',wishes:'Vườn lời chúc',memories:'Kỷ niệm',letter:'Lá thư',closing:'Thương gửi em'};
const blobFor=url=>assetUrls.get(url)||safeImage(url);
function setImage(id,url){$(id).src=blobFor(url);}
function render(data){
  content=data;document.title=`Nến & Hoa · Dành riêng cho ${data.recipient}`;
  ['recipient','sender','occasion','date','year'].forEach(key=>setText(key,data[key]));
  setText('hero-eyebrow',data.hero.eyebrow);setText('title',data.hero.title);setText('highlight',data.hero.highlight);setText('hero-description',data.hero.description);
  setImage('hero-image',data.hero.image);$('hero-image').alt=data.hero.imageAlt;
  setText('candle-title',data.candle.title);setText('candle-description',data.candle.description);updateCandle();
  $('wish-grid').replaceChildren(...data.wishes.map((wish,index)=>{
    const button=document.createElement('button');button.className='wish';
    button.innerHTML=`<span class="wish-number">0${index+1}</span>${flower(index)}<span class="wish-title"></span><span class="wish-preview"></span><span class="wish-action">NHẬN LỜI THƯƠNG ↗</span>`;
    button.querySelector('.wish-title').textContent=wish.title;button.querySelector('.wish-preview').textContent=wish.preview;
    button.addEventListener('click',()=>{openReader('wish',wish.title,[wish.message]);petals(5);});return button;
  }));
  $('memories').hidden=!(data.memories?.length);memoryIndex=0;if(data.memories?.length)showMemory(0);
  refreshScenes();goScene(0,true);
}
function refreshScenes(){
  scenes=[...document.querySelectorAll('.scene')].filter(el=>!el.hidden);
  $('scene-dots').replaceChildren(...scenes.map((scene,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Cảnh ${i+1}: ${sceneNames[scene.id]}`);b.addEventListener('click',()=>goScene(i));return b;}));
}
function goScene(index,instant=false){
  if(!scenes.length||(!instant&&(!started||transitioning||document.querySelector('dialog[open]'))))return;
  index=Math.max(0,Math.min(scenes.length-1,index));if(index===sceneIndex&&!instant)return;
  const previous=scenes[sceneIndex],next=scenes[index],backward=index<sceneIndex;
  if(!instant){transitioning=true;previous?.classList.add(backward?'leaving-down':'leaving-up');if(backward){next.classList.add('enter-from-top');void next.offsetHeight;}}
  scenes.forEach(scene=>{scene.classList.toggle('active',scene===next);scene.inert=scene!==next;scene.setAttribute('aria-hidden',String(scene!==next));});
  next.classList.remove('enter-from-top');sceneIndex=index;document.body.classList.toggle('dark-scene',next.id==='candle');
  [...$('scene-dots').children].forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
  $('scene-prev').disabled=index===0;$('scene-next').disabled=index===scenes.length-1;
  setText('scene-hint',index===scenes.length-1?'Vuốt xuống để xem lại':'Vuốt lên để tiếp tục');
  setText('scene-status',`Cảnh ${index+1} trên ${scenes.length}: ${sceneNames[next.id]}`);
  if(!instant)next.querySelector('h1,h2')?.focus({preventScroll:true});
  setTimeout(()=>{previous?.classList.remove('leaving-up','leaving-down');transitioning=false;},reducedMotion?50:800);
}
$('scene-prev').addEventListener('click',()=>goScene(sceneIndex-1));$('scene-next').addEventListener('click',()=>goScene(sceneIndex+1));
document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>goScene(sceneIndex+1)));
document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();goScene(0);});
let pointerStart;
$('main').addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse')pointerStart={x:e.clientX,y:e.clientY,id:e.pointerId};});
$('main').addEventListener('pointerup',e=>{
  if(!pointerStart||pointerStart.id!==e.pointerId)return;
  const dx=e.clientX-pointerStart.x,dy=e.clientY-pointerStart.y;pointerStart=null;
  if(Math.abs(dy)>=45&&Math.abs(dy)>Math.abs(dx)*1.2)goScene(sceneIndex+(dy<0?1:-1));
});
$('main').addEventListener('pointercancel',()=>pointerStart=null);
let wheelTotal=0,lastWheel=0,wheelConsumed=false;
document.addEventListener('wheel',e=>{
  if(document.querySelector('dialog[open]'))return;
  e.preventDefault();const now=performance.now();if(now-lastWheel>220){wheelTotal=0;wheelConsumed=false;}lastWheel=now;
  if(wheelConsumed)return;wheelTotal+=e.deltaY;if(Math.abs(wheelTotal)>45){wheelConsumed=true;goScene(sceneIndex+(wheelTotal>0?1:-1));}
},{passive:false});
document.addEventListener('keydown',e=>{
  if(!started||document.querySelector('dialog[open]')||e.target.matches('input,textarea,select'))return;
  if(['ArrowDown','PageDown','ArrowUp','PageUp','Home','End'].includes(e.key)){e.preventDefault();if(e.key==='Home')goScene(0);else if(e.key==='End')goScene(scenes.length-1);else goScene(sceneIndex+(['ArrowDown','PageDown'].includes(e.key)?1:-1));}
});
function updateCandle(){
  const poster=content.candle.poster||'assets/candle-still.png',gif=content.candle.animation||'assets/candle-glow.gif';
  setImage('candle-image',lit&&!reducedMotion&&!assetFailures.includes(gif)?gif:lit&&reducedMotion?'assets/candle-lit.png':poster);
  $('candle-toggle').setAttribute('aria-pressed',String(lit));$('candle-toggle').setAttribute('aria-label',lit?'Tắt ngọn nến':'Thắp ngọn nến');
  setText('candle-status',lit?content.candle.litMessage:'Một ngọn nến nhỏ, chờ điều ước của em.');setText('touch-hint',lit?'Chạm để tắt nến · Giữ lại điều ước trong tim':'Chạm để thắp nến ✧');
}
$('candle-toggle').addEventListener('click',()=>{if(!content)return;lit=!lit;updateCandle();if(lit){petals(12);navigator.vibrate?.(25);}});
function petals(count){if(reducedMotion)return;for(let n=0;n<count;n++){const el=document.createElement('span');el.className='petal';el.style.left=`${Math.random()*90}%`;el.style.animationDelay=`${Math.random()*1.5}s`;$('petals').append(el);setTimeout(()=>el.remove(),7000);}}
function showMemory(index){
  const list=content.memories;memoryIndex=Math.max(0,Math.min(index,list.length-1));setImage('memory-image',list[memoryIndex].image);$('memory-image').alt=list[memoryIndex].caption;setText('memory-caption',list[memoryIndex].caption);setText('memory-count',`${memoryIndex+1} / ${list.length}`);$('memory-prev').disabled=memoryIndex===0;$('memory-next').disabled=memoryIndex===list.length-1;
}
$('memory-prev').addEventListener('click',()=>showMemory(memoryIndex-1));$('memory-next').addEventListener('click',()=>showMemory(memoryIndex+1));
function paginateReader(paragraphs){
  const pages=[];const body=$('reader-body');
  // Measure actual rendered text at this device's size/font. Long letters never overflow.
  paragraphs.forEach(paragraph=>{
    const words=paragraph.trim().split(/\s+/);let page='';
    for(const word of words){const candidate=page?`${page} ${word}`:word;body.textContent=candidate;if(page&&body.scrollHeight>body.clientHeight){pages.push(page);page=word;}else page=candidate;
      body.textContent=page;
      if(body.scrollHeight>body.clientHeight&&page.length>1){let chunk='';for(const char of page){body.textContent=chunk+char;if(chunk&&body.scrollHeight>body.clientHeight){pages.push(chunk);chunk=char;}else chunk+=char;}page=chunk;}
    }
    if(page)pages.push(page);
  });
  return pages.length?pages:[''];
}
let readerParagraphs=[];
function openReader(kind,title,paragraphs){
  readerKind=kind;readerHeading=title;readerParagraphs=paragraphs;readerClosing=kind==='letter'?content.letter.closing:'';
  setText('reader-title',title);setText('reader-eyebrow',kind==='letter'?'MỘT LÁ THƯ NGÀY 20/10':'MỘT ĐÓA HOA · MỘT LỜI THƯƠNG');
  // Reserve signature height on every page so pagination remains stable on the last page.
  setText('reader-signature',kind==='letter'?`${readerClosing}\n${content.sender}`:'Với tất cả yêu thương ♡');
  $('reader').showModal();readerPages=paginateReader(paragraphs);readerIndex=0;showReaderPage();
}
function showReaderPage(){setText('reader-body',readerPages[readerIndex]);setText('reader-count',`${readerIndex+1} / ${readerPages.length}`);$('reader-prev').disabled=readerIndex===0;$('reader-next').disabled=readerIndex===readerPages.length-1;$('reader-signature').style.visibility=readerIndex===readerPages.length-1?'visible':'hidden';}
function openLetter(){openReader('letter',content.letter.salutation,content.letter.paragraphs);petals(8);}
$('open-letter').addEventListener('click',openLetter);$('envelope').addEventListener('click',openLetter);
$('reader-prev').addEventListener('click',()=>{if(readerIndex>0){readerIndex--;showReaderPage();}});$('reader-next').addEventListener('click',()=>{if(readerIndex<readerPages.length-1){readerIndex++;showReaderPage();}});
$('close-reader').addEventListener('click',()=>$('reader').close());
$('reader').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('reader-next').click();}else if(e.key==='ArrowLeft'){e.preventDefault();$('reader-prev').click();}});
let readerTouch;
$('reader').addEventListener('pointerdown',e=>{readerTouch={x:e.clientX,y:e.clientY};});
$('reader').addEventListener('pointerup',e=>{if(!readerTouch)return;const dx=e.clientX-readerTouch.x,dy=e.clientY-readerTouch.y;readerTouch=null;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy))$(dx<0?'reader-next':'reader-prev').click();});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($('reader').open){readerPages=paginateReader(readerParagraphs);readerIndex=Math.min(readerIndex,readerPages.length-1);showReaderPage();}},200);});
$('open-customize').addEventListener('click',()=>$('customize').showModal());$('close-customize').addEventListener('click',()=>$('customize').close());
$('json-file').addEventListener('change',async e=>{
  const file=e.target.files[0];if(!file)return;
  try{if(file.size>1024*1024)throw Error('File JSON cần nhỏ hơn 1 MB.');const data=validate(JSON.parse(await file.text()));validateExtras(data);stopMusic();$('customize').close();await prepareGift(data);notify(`Đã gói lại món quà dành cho ${data.recipient}.`);}
  catch(error){notify(error instanceof SyntaxError?'JSON chưa đúng cú pháp. Hãy kiểm tra dấu ngoặc và dấu phẩy.':error.message);}
  finally{e.target.value='';}
});
$('reset').addEventListener('click',async()=>{if(defaults){stopMusic();$('customize').close();await prepareGift(structuredClone(defaults));}});
$('share').addEventListener('click',async()=>{try{if(navigator.share)await navigator.share({title:document.title,text:'Một chút hoa, một chút thương, dành cho em.',url:location.href});else if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(location.href);notify('Đã sao chép đường dẫn để gửi món quà.');}else notify('Sao chép địa chỉ trên trình duyệt để gửi món quà nhé.');}catch(error){if(error.name!=='AbortError')notify('Em có thể sao chép địa chỉ trên trình duyệt để chia sẻ.');}});
function validateExtras(data){
  for(const key of ['animation','poster'])if(data.candle[key])safeImage(data.candle[key]);
  if(data.music!==undefined){if(!data.music||typeof data.music!=='object'||Array.isArray(data.music))throw Error('Kiểm tra trường music trong JSON.');if(typeof data.music.src!=='string')throw Error('music.src cần là đường dẫn MP3 hoặc chuỗi rỗng.');if(data.music.src)safeImage(data.music.src);if(data.music.volume!==undefined&&(!Number.isFinite(data.music.volume)||data.music.volume<0||data.music.volume>1))throw Error('music.volume cần nằm trong khoảng 0 đến 1.');if(data.music.loop!==undefined&&typeof data.music.loop!=='boolean')throw Error('music.loop cần là true hoặc false.');}
}
function soundState(playing){musicPlaying=playing;$('sound').setAttribute('aria-pressed',String(playing));$('sound').setAttribute('aria-label',playing?'Tắt nhạc':'Bật lại nhạc');setText('sound-label',playing?'Tắt nhạc':'Bật lại');setText('sound-icon',playing?'♫':'♪');}
const tune=[261.63,329.63,392,523.25,440,392,329.63,293.66,261.63,392,440,523.25,659.25,523.25,392,329.63];
function playNote(){if(!musicPlaying||audioContext?.state!=='running')return;const t=audioContext.currentTime,o=audioContext.createOscillator(),g=audioContext.createGain();o.type='sine';o.frequency.value=tune[noteIndex++%tune.length];g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.1,t+.025);g.gain.exponentialRampToValueAtTime(.001,t+2.5);o.connect(g);g.connect(master);o.start(t);o.stop(t+2.6);o.onended=()=>{o.disconnect();g.disconnect();};}
function stopMusic(){clearInterval(musicTimer);musicElement?.pause();if(master)master.gain.setTargetAtTime(0,audioContext.currentTime,.1);soundState(false);}
async function startMusic(){
  if(musicBusy)return;musicBusy=true;
  try{
    if(content.music?.src){
      if(assetFailures.includes(content.music.src))throw Error('Tệp nhạc chưa tải được.');
      if(!musicElement){musicElement=new Audio(blobFor(content.music.src));musicElement.loop=content.music.loop!==false;musicElement.volume=content.music.volume??.4;musicElement.addEventListener('ended',()=>soundState(false));musicElement.addEventListener('error',()=>{stopMusic();notify('Chưa phát được file nhạc. Em có thể thử bật lại.');});}
      await musicElement.play();soundState(true);
    }else{
      if(!audioContext){const Context=window.AudioContext||window.webkitAudioContext;if(!Context)throw Error('Thiết bị chưa hỗ trợ nhạc.');audioContext=new Context();master=audioContext.createGain();master.gain.value=0;master.connect(audioContext.destination);}
      await audioContext.resume();master.gain.setTargetAtTime((content.music?.volume??.4)*.65,audioContext.currentTime,.2);soundState(true);playNote();musicTimer=setInterval(playNote,950);
    }
  }catch(error){soundState(false);notify(error.message==='Tệp nhạc chưa tải được.'?'Nhạc chưa tải được. Món quà vẫn sẵn sàng cho em.':'Trình duyệt chưa phát nhạc. Em có thể chạm nút nhạc để thử lại.');}
  finally{musicBusy=false;}
}
$('sound').addEventListener('click',()=>musicPlaying?stopMusic():startMusic());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&musicPlaying)stopMusic();});
$('continue').addEventListener('click',()=>{
  if(!content||$('continue').disabled)return;
  started=true;$('welcome').close();stopFireworks();$('sound').hidden=false;startMusic();goScene(0,true);scenes[0].querySelector('h1')?.focus({preventScroll:true});petals(12);
});
$('welcome').addEventListener('cancel',e=>e.preventDefault());
function stopFireworks(){cancelAnimationFrame(fireworksFrame);clearInterval(fireworksTimer);fireworksFrame=undefined;}
function startFireworks(){
  stopFireworks();const canvas=$('fireworks'),ctx=canvas.getContext('2d');const width=canvas.clientWidth,height=canvas.clientHeight,dpr=Math.min(devicePixelRatio||1,2);canvas.width=width*dpr;canvas.height=height*dpr;ctx.scale(dpr,dpr);
  if(reducedMotion){for(let i=0;i<32;i++){ctx.fillStyle='#bd8b6b';ctx.beginPath();ctx.arc(Math.random()*width,Math.random()*height,1.2,0,Math.PI*2);ctx.fill();}return;}
  let particles=[],last=performance.now();
  function burst(){const x=width*(.15+Math.random()*.7),y=height*(.1+Math.random()*.48);for(let i=0;i<42;i++){const angle=i/42*Math.PI*2,speed=28+Math.random()*64;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1.7,color:['#bd8b6b','#c18591','#d3a458'][i%3]});}}
  function frame(now){const dt=Math.min((now-last)/1000,.04);last=now;ctx.clearRect(0,0,width,height);particles=particles.filter(p=>p.life>0);for(const p of particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=25*dt;ctx.globalAlpha=Math.max(0,p.life/1.7)*.8;ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,1.3,0,Math.PI*2);ctx.fill();}ctx.globalAlpha=1;fireworksFrame=requestAnimationFrame(frame);}
  burst();fireworksTimer=setInterval(burst,1150);fireworksFrame=requestAnimationFrame(frame);
}
async function preloadAsset(path){
  if(assetUrls.has(path))return;
  // Fetch to completion so the welcome screen never hands off to half-downloaded media.
  const response=await fetch(safeImage(path),{signal:AbortSignal.timeout(20000)});if(!response.ok)throw Error(path);const blob=await response.blob();if(!blob.size)throw Error(path);
  const objectUrl=URL.createObjectURL(blob);
  if(!/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(path)&&path!==content?.music?.src){const image=new Image();image.src=objectUrl;try{await image.decode();}catch(error){URL.revokeObjectURL(objectUrl);throw error;}}
  assetUrls.set(path,objectUrl);
}
async function prepareGift(data){
  started=false;stopFireworks();musicElement?.pause();musicElement=null;assetFailures=[];
  $('sound').hidden=true;$('continue').disabled=true;setText('continue','Đang chuẩn bị…');$('retry-loading').hidden=true;
  if(!$('welcome').open)$('welcome').showModal();
  setText('welcome-title','Đang gói một chút yêu thương…');setText('welcome-description','Đợi một chút để món quà được trọn vẹn nhé.');$('loading-progress').hidden=false;$('loading-status').hidden=false;$('loading-bar').style.width='0%';
  content=data;
  const assets=[...new Set([data.hero.image,data.candle.animation||'assets/candle-glow.gif',data.candle.poster||'assets/candle-still.png','assets/candle-lit.png',...(data.memories||[]).map(m=>m.image),...(data.music?.src?[data.music.src]:[])])];
  let complete=0;
  await Promise.all(assets.map(async path=>{try{await preloadAsset(path);}catch{assetFailures.push(path);}finally{complete++;$('loading-bar').style.width=`${complete/assets.length*100}%`;setText('loading-status',`Đã chuẩn bị ${complete} / ${assets.length} tài nguyên`);}}));
  if(document.fonts)await document.fonts.ready;
  render(data);
  $('welcome-title').replaceChildren(document.createTextNode('Chúc mừng 20/10'),document.createElement('br'));
  const name=document.createElement('em');name.textContent=`em ${data.recipient} xinh đẹp`;$('welcome-title').append(name);
  setText('welcome-description','Có một món quà nhỏ đang đợi em. Chạm Tiếp tục để mở thiệp và nghe giai điệu dành riêng cho mình nhé.');
  $('loading-progress').hidden=true;$('loading-status').hidden=true;setText('continue','Tiếp tục ↗');$('continue').disabled=false;
  setText('welcome-footnote',assetFailures.length?'Một vài tài nguyên chưa tải được. Em có thể thử lại hoặc tiếp tục xem thiệp.':'Một chút hoa. Một chút thương. Dành riêng cho em.');$('retry-loading').hidden=!assetFailures.length;startFireworks();
}
$('retry-loading').addEventListener('click',()=>content?prepareGift(content):boot());
async function boot(){
  if(!$('welcome').open)$('welcome').showModal();
  try{const response=await fetch('greeting.json',{signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('JSON unavailable');const data=validate(await response.json());validateExtras(data);defaults=structuredClone(data);await prepareGift(data);}
  catch{setText('welcome-title','Món quà chưa tải xong');setText('welcome-description','Kiểm tra kết nối và file greeting.json, rồi thử tải lại nhé.');setText('loading-status','Chưa tải được thông tin lời chúc.');$('retry-loading').hidden=false;$('continue').disabled=true;}
}
boot();
