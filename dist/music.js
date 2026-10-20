/* Adaptive soundtrack: original demo score or a user-supplied, licensed recording. */
(() => {
  const PHASES = ['ambient', 'build', 'chorus', 'outro'];
  function phaseFor(scene, readerKind, pageKind) {
    if (readerKind === 'letter') {
      if (pageKind === 'highlight') return 'chorus';
      if (pageKind === 'after' || pageKind === 'credits') return 'outro';
      return 'build';
    }
    return scene === 'closing' ? 'outro' : 'ambient';
  }
  function validateMusic(music) {
    if (music === undefined) return;
    if (!music || typeof music !== 'object' || Array.isArray(music)) throw Error('Kiểm tra trường music trong JSON.');
    if (typeof music.src !== 'string') throw Error('music.src cần là đường dẫn MP3 hoặc chuỗi rỗng.');
    if (music.ambientSrc !== undefined && typeof music.ambientSrc !== 'string') throw Error('music.ambientSrc cần là đường dẫn nhạc nền hoặc chuỗi rỗng.');
    if (music.volume !== undefined && (!Number.isFinite(music.volume) || music.volume < 0 || music.volume > 1)) throw Error('music.volume cần nằm trong khoảng 0 đến 1.');
    if (music.loop !== undefined && typeof music.loop !== 'boolean') throw Error('music.loop cần là true hoặc false.');
    if (music.crossfade !== undefined && (!Number.isFinite(music.crossfade) || music.crossfade < .15 || music.crossfade > 4)) throw Error('music.crossfade cần từ 0.15 đến 4 giây.');
    if (music.cues != null) {
      if (typeof music.cues !== 'object' || Array.isArray(music.cues)) throw Error('music.cues cần chứa bốn mốc nhạc.');
      for (const phase of PHASES) {
        const cue = music.cues[phase];
        if (!cue || !Number.isFinite(cue.start) || !Number.isFinite(cue.end) || cue.start < 0 || cue.end <= cue.start || cue.end - cue.start < .25) throw Error(`Kiểm tra mốc bắt đầu/kết thúc music.cues.${phase}.`);
      }
    }
    if (music.credit != null) {
      if (typeof music.credit !== 'object' || Array.isArray(music.credit)) throw Error('music.credit cần là thông tin nguồn nhạc.');
      for (const key of ['title', 'performer', 'composer', 'sourceUrl', 'note']) {
        if (music.credit[key] !== undefined && (typeof music.credit[key] !== 'string' || music.credit[key].length > (key === 'sourceUrl' ? 2000 : 200))) throw Error(`Kiểm tra music.credit.${key}.`);
      }
    }
  }
  // Original arpeggios; these do not reproduce the melody of any recommended song.
  function demoBuffer(ctx, phase) {
    const beat = .72, duration = beat * 16, rate = ctx.sampleRate;
    const buffer = ctx.createBuffer(1, Math.ceil(duration * rate), rate);
    const samples = buffer.getChannelData(0);
    const chords = [[60,64,67,72],[57,60,64,69],[53,57,60,65],[55,59,62,67]];
    const pattern = phase === 'chorus' ? [0,1,2,3,2,1,3,2] : [0,2,1,2];
    const step = phase === 'chorus' ? beat / 2 : beat;
    const brightness = phase === 'ambient' ? .1 : phase === 'build' ? .17 : phase === 'chorus' ? .23 : .09;
    function note(midi, at, gain, length) {
      const frequency = 440 * 2 ** ((midi-69)/12), offset = Math.floor(at * rate);
      for (let i=0; i<Math.floor(length*rate); i++) {
        const t=i/rate, attack=Math.min(1,t/.018), envelope=attack*Math.exp(-t*2.2);
        const tone=Math.sin(2*Math.PI*frequency*t)+.21*Math.sin(4*Math.PI*frequency*t)+.07*Math.sin(6*Math.PI*frequency*t);
        // Wrap decays into the loop so its start/end meet naturally.
        samples[(offset+i)%samples.length] += tone*envelope*gain;
      }
    }
    for(let n=0;n<Math.round(duration/step);n++) {
      const chord=chords[Math.floor(n*step/(beat*4))%4];
      note(chord[pattern[n%pattern.length]],n*step,brightness,2.6);
    }
    for(let bar=0;bar<4;bar++) note(chords[bar][0]-12,bar*beat*4,.08,3.2);
    if(phase==='chorus')for(let bar=0;bar<4;bar++)note(chords[bar][3]+12,bar*beat*4+beat,.07,2.8);
    return buffer;
  }
  class AdaptiveScore {
    constructor({config={src:''},loadBytes,onState=()=>{},onError=()=>{},contextFactory,schedule=(callback,delay)=>setTimeout(callback,delay),unschedule=timer=>clearTimeout(timer)}) {
      validateMusic(config);
      this.config=config;this.loadBytes=loadBytes;this.onState=onState;this.onError=onError;
      this.contextFactory=contextFactory||(()=>new (window.AudioContext||window.webkitAudioContext)());
      this.schedule=schedule;this.unschedule=unschedule;
      this.desired='ambient';this.playing=false;this.voices=new Set();this.buffers=new Map();this.session=0;this.revision=0;
    }
    setCue(phase) {
      if(!PHASES.includes(phase))throw Error('Unknown music cue');
      if(this.desired===phase)return;
      this.desired=phase;
      if(this.playing)this.transition(phase);
    }
    async play() {
      if(this.playing)return;
      const session=++this.session;
      try {
        if(!this.ctx){this.ctx=this.contextFactory();this.master=this.ctx.createGain();this.master.gain.value=this.config.volume??.4;this.master.connect(this.ctx.destination);}
        // Resume directly in the button gesture, before loading/decoding awaits.
        const resumed=this.ctx.resume();this.playing=true;
        await resumed;if(session!==this.session||!this.playing)return;
        this.onState(true);await this.transition(this.desired);
      } catch(error) {if(session===this.session)this.fail(error);}
    }
    stop() {
      this.playing=false;this.session++;this.revision++;
      for(const voice of this.voices)this.retire(voice,.12);
      this.onState(false);
    }
    dispose() {this.stop();this.ctx?.close?.().catch(()=>{});this.buffers.clear();}
    fail(error) {this.stop();this.onError(error);}
    retire(voice,fade) {
      if(voice.retiring)return;voice.retiring=true;
      if(voice.outroTimer!==undefined)this.unschedule(voice.outroTimer);
      const now=this.ctx.currentTime;
      // cancelAndHold prevents a rapid sequence of swipes from jumping gain.
      if(voice.gain.gain.cancelAndHoldAtTime)voice.gain.gain.cancelAndHoldAtTime(now);
      else {voice.gain.gain.cancelScheduledValues(now);voice.gain.gain.setValueAtTime(voice.gain.gain.value,now);}
      voice.gain.gain.linearRampToValueAtTime(0,now+fade);
      try{voice.source.stop(now+fade+.015);}catch{}
    }
    async getBuffer(path,phase) {
      const key=path||`demo:${phase}`;
      if(!this.buffers.has(key)) {
        const promise=path?Promise.resolve().then(()=>this.loadBytes(path)).then(bytes=>this.ctx.decodeAudioData(bytes)):Promise.resolve(demoBuffer(this.ctx,phase));
        this.buffers.set(key,promise);
        promise.catch(()=>{this.buffers.delete(key);});
      }
      return this.buffers.get(key);
    }
    async transition(phase) {
      const ambient=this.config.ambientSrc||this.config.src;
      const path=phase==='ambient'?ambient:this.config.src;
      // Legacy JSON without cue points keeps its full recording playing.
      if(path&&!this.config.cues&&[...this.voices].some(voice=>!voice.retiring&&voice.path===path)){this.activePhase=phase;return;}
      const revision=++this.revision;
      try {
        const buffer=await this.getBuffer(path,phase);
        if(!this.playing||revision!==this.revision)return;
        const cue=path?this.config.cues?.[phase]:null;
        const start=cue?.start??0,end=cue?.end??buffer.duration;
        if(start>=buffer.duration||end>buffer.duration+.025)throw Error(`Mốc ${phase} nằm ngoài độ dài file nhạc.`);
        const source=this.ctx.createBufferSource(),gain=this.ctx.createGain(),now=this.ctx.currentTime;
        const fade=Math.min(this.config.crossfade??1.1,(end-start)/3);
        const segmented=!path||Boolean(this.config.cues);
        const loop=segmented?phase!=='chorus':this.config.loop!==false;
        source.buffer=buffer;source.loop=loop;source.loopStart=start;source.loopEnd=Math.min(end,buffer.duration);
        const level=segmented?{ambient:.48,build:.62,chorus:1,outro:.45}[phase]:1;
        gain.gain.setValueAtTime(0,now);gain.gain.linearRampToValueAtTime(level,now+fade);
        source.connect(gain);gain.connect(this.master);
        const voice={source,gain,revision,path,retiring:false};
        for(const old of this.voices)this.retire(old,fade);
        this.voices.add(voice);
        source.onended=()=>{
          if(voice.outroTimer!==undefined)this.unschedule(voice.outroTimer);
          source.disconnect();gain.disconnect();this.voices.delete(voice);
          if(!voice.retiring&&this.playing&&revision===this.revision){
            if(phase==='chorus'&&segmented)this.transition('outro');
            else if(!loop)this.stop();
          }
        };
        source.start(now,start);if(!loop)source.stop(now+(end-start));
        if(phase==='chorus'&&segmented)voice.outroTimer=this.schedule(()=>{if(this.playing&&!voice.retiring&&revision===this.revision)this.transition('outro');},Math.max(0,end-start-fade)*1000);
        this.activePhase=phase;
      } catch(error) {if(this.playing&&revision===this.revision)this.fail(error);}
    }
  }
  globalThis.GreetingAudio={AdaptiveScore,validateMusic,phaseFor};
})();
