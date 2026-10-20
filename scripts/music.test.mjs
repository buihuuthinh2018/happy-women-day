import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const sandbox={setTimeout,clearTimeout};
vm.runInNewContext(await readFile('dist/music.js','utf8'),sandbox);
const {AdaptiveScore,validateMusic,phaseFor}=sandbox.GreetingAudio;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const cues={ambient:{start:0,end:8},build:{start:10,end:18},chorus:{start:20,end:32},outro:{start:34,end:42}};
function fixture(overrides={}){
  const sources=[],ramps=[],scheduled=[],states=[],errors=[];
  const parameter=()=>({value:0,setValueAtTime(value){this.value=value;},linearRampToValueAtTime(value,time){this.value=value;ramps.push({value,time});},cancelAndHoldAtTime(){}});
  const context={currentTime:0,sampleRate:8000,destination:{},resume:async()=>{},close:async()=>{},decodeAudioData:async()=>({duration:50}),createGain:()=>({gain:parameter(),connect(){},disconnect(){}}),createBufferSource:()=>{const source={connect(){},disconnect(){},start(time,offset){this.offset=offset;},stop(time){this.stoppedAt=time;}};sources.push(source);return source;},createBuffer:(channels,length,rate)=>({duration:length/rate,getChannelData:()=>new Float32Array(length)})};
  const score=new AdaptiveScore({config:{src:'music.mp3',cues,crossfade:1},contextFactory:()=>context,loadBytes:async()=>new ArrayBuffer(8),onState:value=>states.push(value),onError:error=>errors.push(error),schedule:(callback,delay)=>{const timer={callback,delay};scheduled.push(timer);return timer;},unschedule:timer=>timer.cancelled=true,...overrides});
  return {score,context,sources,ramps,scheduled,states,errors};
}
test('reading position selects ambience, build, climax and ending',()=>{
  assert.equal(phaseFor('candle'),'ambient');assert.equal(phaseFor('letter','letter','body'),'build');assert.equal(phaseFor('letter','letter','highlight'),'chorus');assert.equal(phaseFor('letter','letter','after'),'outro');assert.equal(phaseFor('letter','letter','credits'),'outro');assert.equal(phaseFor('closing'),'outro');assert.equal(phaseFor('wishes','wish','body'),'ambient');
});
test('reject incomplete/invalid cue ranges before changing content',()=>{
  assert.throws(()=>validateMusic({src:'a.mp3',cues:{ambient:{start:0,end:4}}}));
  assert.throws(()=>validateMusic({src:'',volume:2}));
  assert.throws(()=>validateMusic({src:'a.mp3',cues:{...cues,chorus:{start:20,end:19}}}));
  validateMusic({src:'',cues:null});
});
test('no autoplay; a muted phase change remains silent; unmute uses current phase',async()=>{
  const f=fixture();f.score.setCue('chorus');assert.equal(f.sources.length,0);await f.score.play();assert.equal(f.sources[0].offset,20);f.score.stop();f.score.setCue('outro');await tick();assert.equal(f.sources.length,1);assert.equal(f.score.playing,false);await f.score.play();assert.equal(f.sources.at(-1).offset,34);f.score.dispose();
});
test('crossfades to chorus once, then schedules a gentle tail instead of repeating',async()=>{
  const f=fixture();await f.score.play();f.score.setCue('build');await tick();f.score.setCue('chorus');await tick();assert.equal(f.sources.length,3);assert.equal(f.sources[0].loop,true);assert.equal(f.sources[2].loop,false);assert.equal(f.sources[1].stoppedAt,1.015);assert.equal(f.scheduled[0].delay,11000);
  f.score.setCue('chorus');await tick();assert.equal(f.sources.length,3);f.scheduled[0].callback();await tick();assert.equal(f.sources.at(-1).offset,34);assert.equal(f.score.desired,'chorus');f.score.setCue('chorus');await tick();assert.equal(f.sources.length,4);f.score.dispose();
});
test('muting cancels pending decode and does not resurrect audio',async()=>{
  let finish;const f=fixture({loadBytes:()=>new Promise(resolve=>finish=resolve)});const playing=f.score.play();await tick();f.score.stop();finish(new ArrayBuffer(8));await playing;assert.equal(f.sources.length,0);assert.equal(f.score.playing,false);f.score.dispose();
});
test('rapid changes discard stale loads and only start latest cue',async()=>{
  let finish;const f=fixture({loadBytes:()=>new Promise(resolve=>finish=resolve)});const playing=f.score.play();await tick();f.score.setCue('build');f.score.setCue('chorus');finish(new ArrayBuffer(8));await playing;await tick();assert.equal(f.sources.length,1);assert.equal(f.sources[0].offset,20);f.score.dispose();
});
test('out-of-file cue shows an error and stops, rather than seeking incorrectly',async()=>{
  const f=fixture({config:{src:'a.mp3',cues:{...cues,chorus:{start:49,end:70}}}});await f.score.play();f.score.setCue('chorus');await tick();assert.equal(f.errors.length,1);assert.equal(f.score.playing,false);f.score.dispose();
});
test('original demo has distinct scores and no recording download',async()=>{
  let loaded=false;const f=fixture({config:{src:''},loadBytes:async()=>{loaded=true;}});await f.score.play();const ambient=f.sources[0].buffer;f.score.setCue('chorus');await tick();assert.notEqual(f.sources.at(-1).buffer,ambient);assert.equal(loaded,false);assert.ok(ambient.duration>0);f.score.dispose();
});
test('legacy JSON without cue points keeps the full song continuous',async()=>{
  const f=fixture({config:{src:'a.mp3',loop:false}});await f.score.play();f.score.setCue('build');await tick();f.score.setCue('chorus');await tick();assert.equal(f.sources.length,1);assert.equal(f.score.activePhase,'chorus');f.sources[0].onended();assert.equal(f.score.playing,false);f.score.dispose();
});
