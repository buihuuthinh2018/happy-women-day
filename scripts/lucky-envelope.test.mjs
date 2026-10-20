import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile('dist/lucky-envelope.js','utf8');
function fixture(values=[0]){
  const data=new Map(),context={crypto:{getRandomValues(array){array[0]=values.shift()??0;return array;}}};
  vm.runInNewContext(source,context);
  const storage={getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,value)};
  return {api:context.LuckyEnvelope,storage,data};
}
test('first opening persists; repeated opening and a new instance reuse the result',()=>{
  const f=fixture();let draws=0;const gift=f.api.create(f.storage,()=>{draws++;return 137000;});
  assert.equal(gift.read(),null);const result=gift.open();assert.equal(result.amount,137000);
  assert.equal(gift.open().amount,137000);assert.equal(f.api.create(f.storage,()=>199000).open().amount,137000);assert.equal(draws,1);
  assert.equal(JSON.parse(f.data.get(f.api.KEY)).openedAt,result.openedAt);
});
test('all 100 whole-thousand amounts, including both endpoints, are reachable',()=>{
  const amounts=new Set();for(let n=0;n<100;n++){const f=fixture([n]);amounts.add(f.api.create(f.storage).open().amount);}
  assert.equal(amounts.size,100);assert.ok(amounts.has(100000));assert.ok(amounts.has(199000));
});
test('rejects out-of-range crypto values before drawing an unbiased bucket',()=>{
  const f=fixture([4294967295,99]);assert.equal(f.api.create(f.storage).open().amount,199000);
});
test('write failures do not reveal or cache a result',()=>{
  const f=fixture();const storage={...f.storage,setItem(){throw Error('Quota');}};
  assert.throws(()=>f.api.create(storage).open(),/Quota/);assert.equal(f.api.create(f.storage).read(),null);
});
test('corrupt existing data cannot silently reroll a previously opened envelope',()=>{
  const f=fixture();f.data.set(f.api.KEY,'{"amount":900000}');let draws=0;
  assert.throws(()=>f.api.create(f.storage,()=>{draws++;return 100000;}).open());assert.equal(draws,0);
});
