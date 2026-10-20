let scenes=[],sceneIndex=0,transitioning=false,started=false,assetUrls=new Map(),assetFailures=[],memoryIndex=0;
let readerPages=[],readerIndex=0,readerKind='',readerHeading='',readerClosing='';
let readerBusy=false,readerMotion=null,envelopeTimer=null,readerSlider=null,readerSliderElement=null;
let musicPlaying=false,score;
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
  refreshScenes();goScene(0,true);restoreLuckyEnvelope();
}
let luckyBusy=false;
function showLuckyEnvelope(result){
  const opened=Boolean(result),button=$('lucky-envelope');
  button.classList.toggle('is-open',opened);button.setAttribute('aria-pressed',String(opened));
  const amount=opened?new Intl.NumberFormat('vi-VN').format(result.amount)+'đ':'';
  setText('lucky-amount',amount);setText('lucky-hint',opened?`Em nhận được ${amount} ♡`:'Chạm mở lì xì · Một chút may mắn cho em');
  button.setAttribute('aria-label',opened?`Bao lì xì đã mở: ${amount}`:'Mở bao lì xì may mắn');
}
function restoreLuckyEnvelope(){
  try{showLuckyEnvelope(LuckyEnvelope.create(localStorage).read());}catch{showLuckyEnvelope(null);}
}
$('lucky-envelope').addEventListener('click',async()=>{
  if(luckyBusy)return;luckyBusy=true;
  try{
    const claim=()=>LuckyEnvelope.create(localStorage).open();
    // Serialize claims across tabs when Web Locks is available.
    const result=navigator.locks?await navigator.locks.request(LuckyEnvelope.KEY,claim):claim();
    const first=!$('lucky-envelope').classList.contains('is-open');showLuckyEnvelope(result);
    if(first){petals(18);navigator.vibrate?.([30,50,30]);}
  }catch{notify('Chưa lưu được lì xì. Em hãy cho phép trình duyệt lưu dữ liệu rồi thử lại nhé.');}
  finally{luckyBusy=false;}
});
window.addEventListener('storage',event=>{if(event.key===LuckyEnvelope.KEY)restoreLuckyEnvelope();});
function refreshScenes(){
  scenes=[...document.querySelectorAll('.scene')].filter(el=>!el.hidden);
  $('scene-dots').replaceChildren(...scenes.map((scene,i)=>{const b=document.createElement('button');b.setAttribute('aria-label',`Cảnh ${i+1}: ${sceneNames[scene.id]}`);b.addEventListener('click',()=>goScene(i));return b;}));
}
function goScene(index,instant=false){
  if(!scenes.length||(!instant&&(!started||transitioning||document.querySelector('dialog[open]'))))return;
  index=Math.max(0,Math.min(scenes.length-1,index));if(index===sceneIndex&&!instant)return;
  cancelEnvelopeOpening();
  const previous=scenes[sceneIndex],next=scenes[index],backward=index<sceneIndex;
  if(!instant){transitioning=true;previous?.classList.add(backward?'leaving-down':'leaving-up');if(backward){next.classList.add('enter-from-top');void next.offsetHeight;}}
  scenes.forEach(scene=>{scene.classList.toggle('active',scene===next);scene.inert=scene!==next;scene.setAttribute('aria-hidden',String(scene!==next));});
  next.classList.remove('enter-from-top');sceneIndex=index;document.body.classList.toggle('dark-scene',next.id==='candle');
  [...$('scene-dots').children].forEach((b,i)=>b.setAttribute('aria-current',String(i===index)));
  $('scene-prev').disabled=index===0;$('scene-next').disabled=index===scenes.length-1;
  setText('scene-hint',index===scenes.length-1?'Vuốt xuống để xem lại':'Vuốt lên để tiếp tục');
  setText('scene-status',`Cảnh ${index+1} trên ${scenes.length}: ${sceneNames[next.id]}`);
  if(started)score?.setCue(GreetingAudio.phaseFor(next.id));
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
function buildReaderPages(paragraphs){
  $('reader').classList.remove('is-highlight','is-credits');
  setText('reader-signature',readerKind==='letter'?`${readerClosing}\n${content.sender}`:'Với tất cả yêu thương ♡');
  const highlight=readerKind==='letter'?content.letter.highlight:null;
  let afterHighlight=false;
  const pages=[];
  paragraphs.forEach((paragraph,index)=>{
    $('reader').classList.remove('is-highlight');
    pages.push(...paginateReader([paragraph]).map(text=>({text,kind:afterHighlight?'after':'body'})));
    if(highlight&&highlight.afterParagraph===index){
      $('reader').classList.add('is-highlight');
      pages.push(...paginateReader([highlight.text]).map(text=>({text,kind:'highlight'})));
      afterHighlight=true;
    }
  });
  $('reader').classList.remove('is-highlight');
  if(readerKind==='letter'&&content.music?.credit?.title){
    const credit=content.music.credit;
    const text=[credit.title,credit.performer&&`Thể hiện: ${credit.performer}.`,credit.composer&&`Sáng tác: ${credit.composer}.`,credit.note].filter(Boolean).join(' ');
    pages.push(...paginateReader([text]).map(text=>({kind:'credits',text})));
  }
  return pages;
}
function openReader(kind,title,paragraphs,origin=null){
  cancelReaderMotion();destroyReaderSlider();
  readerKind=kind;readerHeading=title;readerParagraphs=paragraphs;readerClosing=kind==='letter'?content.letter.closing:'';
  setText('reader-title',title);setText('reader-eyebrow',kind==='letter'?'MỘT LÁ THƯ NGÀY 20/10':'MỘT ĐÓA HOA · MỘT LỜI THƯƠNG');
  // Reserve signature height on every page so pagination remains stable on the last page.
  setText('reader-signature',kind==='letter'?`${readerClosing}\n${content.sender}`:'Với tất cả yêu thương ♡');
  $('reader').classList.toggle('is-letter',kind==='letter');
  $('reader').showModal();readerPages=buildReaderPages(paragraphs);readerIndex=0;mountReaderSlider();showReaderPage();
  $('envelope').classList.toggle('is-empty',kind==='letter');
  if(!reducedMotion){
    readerBusy=true;updateReaderNavigation();
    const reader=$('reader'),target=reader.getBoundingClientRect();
    reader.classList.add('is-lifting');
    const from=origin?`translate3d(${origin.left-target.left}px,${origin.top-target.top}px,0) scale(${origin.width/target.width},${origin.height/target.height})`:'translate3d(0,24px,0) scale(.96)';
    // Continue from the extracted sheet's on-screen rectangle, with no reset
    // between the envelope and the modal in the browser's top layer.
    const animation=reader.querySelector('.reader-surface').animate([{transform:from,opacity:origin?1:.3},{transform:'translate3d(0,0,0) scale(1)',opacity:1}],{duration:origin?760:380,easing:'cubic-bezier(.22,.65,.28,1)'});
    trackReaderMotion(animation);
  }
}
function showReaderPage(sync=true){
  const page=readerPages[readerIndex],body=$('reader-body');
  $('reader').classList.toggle('is-highlight',page.kind==='highlight');
  $('reader').classList.toggle('is-credits',page.kind==='credits');
  setText('reader-title',page.kind==='credits'?'Giai điệu gửi em':page.kind==='highlight'?'Một điều muốn em nhớ…':readerHeading);
  if(page.kind==='credits')renderMusicCredit(body,page.text);
  else if(page.kind==='highlight'){
    // Short phrases stay readable throughout; only their gentle arrival is animated.
    body.replaceChildren(...page.text.split(/(?<=[,.;!?…])\s+/).map((text,index)=>{const span=document.createElement('span');span.textContent=text+' ';span.style.setProperty('--phrase-delay',`${index*.65+.4}s`);return span;}));
  }else body.textContent=page.text;
  const signaturePage=readerPages.findLastIndex(page=>page.kind!=='credits');
  if(page.kind!=='credits')setText('reader-signature',readerKind==='letter'?`${readerClosing}\n${content.sender}`:'Với tất cả yêu thương ♡');
  $('reader-signature').style.visibility=page.kind==='credits'||readerIndex===signaturePage?'visible':'hidden';
  if(!sync)return;
  syncReaderSlides();
  setText('reader-count',`${readerIndex+1} / ${readerPages.length}`);updateReaderNavigation();
  score?.setCue(GreetingAudio.phaseFor(scenes[sceneIndex]?.id,readerKind,page.kind));
}
function renderMusicCredit(body,text){
  const credit=content.music.credit;
  body.textContent=text;setText('reader-signature','Một chút hoa. Một chút thương. ♡');
  if(credit.sourceUrl){const link=document.createElement('a');link.href=safeImage(credit.sourceUrl);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Nguồn nhạc ↗';link.className='credit-source';$('reader-signature').replaceChildren(link);}
}
function cancelEnvelopeOpening(){
  clearTimeout(envelopeTimer);envelopeTimer=null;$('envelope').classList.remove('is-opening');$('envelope').disabled=false;$('open-letter').disabled=false;
}
function openLetter(){
  if(envelopeTimer!==null||$('reader').open)return;
  if(reducedMotion){openReader('letter',content.letter.salutation,content.letter.paragraphs);return;}
  $('envelope').classList.add('is-opening');$('envelope').disabled=true;$('open-letter').disabled=true;
  envelopeTimer=setTimeout(()=>{
    const origin=$('envelope').querySelector('.envelope-paper').getBoundingClientRect();
    openReader('letter',content.letter.salutation,content.letter.paragraphs,origin);
    cancelEnvelopeOpening();petals(8);
  },560);
}
$('open-letter').addEventListener('click',openLetter);$('envelope').addEventListener('click',openLetter);
function updateReaderNavigation(){
  $('reader-prev').disabled=readerBusy||readerIndex===0;$('reader-next').disabled=readerBusy||readerIndex===readerPages.length-1;
}
function cancelReaderMotion(){
  const motion=readerMotion;readerMotion=null;readerBusy=false;
  if(motion){motion.animation.cancel();motion.sheet?.remove();}
  $('reader').classList.remove('is-lifting');
}
function trackReaderMotion(animation,sheet){
  const motion={animation,sheet};readerMotion=motion;
  const finish=()=>{
    sheet?.remove();if(readerMotion!==motion)return;
    readerMotion=null;readerBusy=false;$('reader').classList.remove('is-lifting');updateReaderNavigation();
  };
  animation.finished.then(finish,finish);
}
// Prepare each sheet once. Dragging only translates Swiper's cached slide track.
function readerSnapshot(){
  const paper=$('reader-paper'),clone=paper.cloneNode(true);
  const originals=[paper,...paper.querySelectorAll('*')],copies=[clone,...clone.querySelectorAll('*')];
  originals.forEach((element,index)=>{
    const copy=copies[index],style=getComputedStyle(element);
    copy.removeAttribute('id');copy.removeAttribute('tabindex');
    for(const property of ['font-family','font-size','font-weight','font-style','line-height','color','text-align','white-space'])copy.style.setProperty(property,style.getPropertyValue(property));
    copy.style.animation='none';copy.style.opacity='1';copy.style.filter='none';
  });
  clone.classList.add('swiper-slide');clone.style.height='100%';clone.style.width='100%';clone.style.flex='0 0 auto';
  return clone;
}
function destroyReaderSlider(){
  readerSlider?.destroy(true,true);readerSlider=null;
  readerSliderElement?.remove();readerSliderElement=null;$('reader-paper').hidden=false;
}
function syncReaderSlides(){
  if(!readerSlider)return;
  [...readerSlider.slides].forEach((slide,index)=>{
    slide.inert=index!==readerIndex;slide.setAttribute('aria-hidden',String(index!==readerIndex));
  });
}
function mountReaderSlider(){
  const selected=readerIndex,element=document.createElement('div'),wrapper=document.createElement('div');
  element.className='reader-slider swiper';element.setAttribute('aria-label','Các trang thư');
  wrapper.className='swiper-wrapper';element.append(wrapper);
  readerPages.forEach((page,index)=>{
    readerIndex=index;showReaderPage(false);
    const slide=readerSnapshot();slide.setAttribute('role','group');slide.setAttribute('aria-label',`Trang ${index+1} trên ${readerPages.length}`);wrapper.append(slide);
  });
  readerIndex=selected;showReaderPage();
  $('reader-paper').after(element);$('reader-paper').hidden=true;readerSliderElement=element;
  // Invalid starts pass through without preventDefault, preserving OS gestures.
  const gate=event=>{
    const point=event.touches?.[0]||event;
    const valid=LetterGestures.canStart({x:point.clientX,y:point.clientY,width:innerWidth,height:innerHeight,paper:element.getBoundingClientRect(),interactive:Boolean(event.target.closest('button,a,input,select,textarea')),busy:readerBusy,touches:event.touches?.length??1,scale:window.visualViewport?.scale||1});
    if(event.touches?.length>1&&readerSlider)readerSlider.allowTouchMove=false;
    if(valid&&readerSlider)readerSlider.allowTouchMove=true;
    if(!valid)event.stopImmediatePropagation();
  };
  element.addEventListener('pointerdown',gate,{capture:true});element.addEventListener('touchstart',gate,{capture:true,passive:true});
  readerSlider=new Swiper(element,{
    initialSlide:selected,speed:reducedMotion?0:360,spaceBetween:24,threshold:8,touchAngle:35,longSwipesRatio:.28,
    followFinger:true,grabCursor:true,loop:false,rewind:false,resistanceRatio:.25,
    edgeSwipeDetection:true,edgeSwipeThreshold:44,touchStartPreventDefault:false,
    preventInteractionOnTransition:true,updateOnWindowResize:false,resizeObserver:false,
    on:{
      slideChange(swiper){readerIndex=swiper.activeIndex;showReaderPage();},
      transitionStart(){readerBusy=true;updateReaderNavigation();},
      transitionEnd(){readerBusy=false;updateReaderNavigation();}
    }
  });
  syncReaderSlides();
}
function turnReaderPage(direction){
  if(readerBusy||!$('reader').open||!readerSlider)return false;
  const next=readerIndex+direction;if(next<0||next>=readerPages.length)return false;
  readerSlider.slideTo(next);return true;
}
$('reader-prev').addEventListener('click',()=>turnReaderPage(-1));$('reader-next').addEventListener('click',()=>turnReaderPage(1));
$('close-reader').addEventListener('click',()=>{cancelReaderMotion();$('reader').close();});
$('reader').addEventListener('close',()=>{cancelReaderMotion();destroyReaderSlider();$('envelope').classList.remove('is-empty');score?.setCue(GreetingAudio.phaseFor(scenes[sceneIndex]?.id));});
$('reader').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();$('reader-next').click();}else if(e.key==='ArrowLeft'){e.preventDefault();$('reader-prev').click();}});
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if($('reader').open){cancelReaderMotion();destroyReaderSlider();const oldKind=readerPages[readerIndex]?.kind;readerPages=buildReaderPages(readerParagraphs);if(oldKind==='highlight'||oldKind==='credits')readerIndex=Math.max(0,readerPages.findIndex(page=>page.kind===oldKind));else readerIndex=Math.min(readerIndex,readerPages.length-1);mountReaderSlider();showReaderPage();}},200);});
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
  GreetingAudio.validateMusic(data.music);
  if(data.music?.src)safeImage(data.music.src);
  if(data.music?.ambientSrc)safeImage(data.music.ambientSrc);
  if(data.music?.credit?.sourceUrl)safeImage(data.music.credit.sourceUrl);
  const highlight=data.letter.highlight;
  if(highlight!=null&&(!highlight||typeof highlight!=='object'||Array.isArray(highlight)||!Number.isInteger(highlight.afterParagraph)||highlight.afterParagraph<0||highlight.afterParagraph>=data.letter.paragraphs.length||typeof highlight.text!=='string'||!highlight.text.trim()||highlight.text.length>600))throw Error('Kiểm tra letter.highlight: vị trí đoạn và lời nhắn (tối đa 600 ký tự).');
}
function soundState(playing){musicPlaying=playing;for(const id of ['sound','reader-sound']){$(id).setAttribute('aria-pressed',String(playing));$(id).setAttribute('aria-label',playing?'Tắt nhạc':'Bật lại nhạc');}setText('sound-label',playing?'Tắt nhạc':'Bật lại');setText('sound-icon',playing?'♫':'♪');setText('reader-sound',playing?'♫ Tắt nhạc':'♪ Bật lại nhạc');}
function stopMusic(){score?.stop();soundState(false);}
function startMusic(){
  if(!score)score=new GreetingAudio.AdaptiveScore({config:content.music||{src:''},loadBytes:async path=>{if(assetFailures.includes(path))throw Error('Tệp nhạc chưa tải được.');return (await fetch(blobFor(path))).arrayBuffer();},onState:soundState,onError:error=>{console.warn('Music playback:',error.message);notify('Chưa phát được nhạc. Em có thể tiếp tục đọc thư và thử nút nhạc sau.');}});
  score.setCue($('reader').open?GreetingAudio.phaseFor(scenes[sceneIndex]?.id,readerKind,readerPages[readerIndex]?.kind):GreetingAudio.phaseFor(scenes[sceneIndex]?.id));
  return score.play();
}
for(const id of ['sound','reader-sound'])$(id).addEventListener('click',()=>musicPlaying?stopMusic():startMusic());
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
  if(!/\.(mp3|wav|ogg|m4a)(\?|$)/i.test(path)&&path!==content?.music?.src&&path!==content?.music?.ambientSrc){const image=new Image();image.src=objectUrl;try{await image.decode();}catch(error){URL.revokeObjectURL(objectUrl);throw error;}}
  assetUrls.set(path,objectUrl);
}
async function prepareGift(data){
  started=false;stopFireworks();score?.dispose();score=null;assetFailures=[];
  $('sound').hidden=true;$('continue').disabled=true;setText('continue','Đang chuẩn bị…');$('retry-loading').hidden=true;
  if(!$('welcome').open)$('welcome').showModal();
  setText('welcome-title','Đang gói một chút yêu thương…');setText('welcome-description','Đợi một chút để món quà được trọn vẹn nhé.');$('loading-progress').hidden=false;$('loading-status').hidden=false;$('loading-bar').style.width='0%';
  content=data;
  const assets=[...new Set([data.hero.image,data.candle.animation||'assets/candle-glow.gif',data.candle.poster||'assets/candle-still.png','assets/candle-lit.png',...(data.memories||[]).map(m=>m.image),...(data.music?.src?[data.music.src]:[]),...(data.music?.ambientSrc?[data.music.ambientSrc]:[])])];
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
  try{const response=await fetch('greeting.json',{cache:'no-store',signal:AbortSignal.timeout(15000)});if(!response.ok)throw Error('JSON unavailable');const data=validate(await response.json());validateExtras(data);defaults=structuredClone(data);await prepareGift(data);}
  catch{setText('welcome-title','Món quà chưa tải xong');setText('welcome-description','Kiểm tra kết nối và file greeting.json, rồi thử tải lại nhé.');setText('loading-status','Chưa tải được thông tin lời chúc.');$('retry-loading').hidden=false;$('continue').disabled=true;}
}
boot();
