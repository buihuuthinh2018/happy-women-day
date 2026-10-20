// One result per browser/origin, shared by reloads and future visits.
(() => {
  const KEY='happy-women-day:lucky-envelope:v1';
  function randomAmount(){
    const bytes=new Uint32Array(1),limit=4294967200;
    do{crypto.getRandomValues(bytes);}while(bytes[0]>=limit);
    return (100+bytes[0]%100)*1000;
  }
  function create(storage,draw=randomAmount){
    function read(){
      const raw=storage.getItem(KEY);if(raw===null)return null;
      const result=JSON.parse(raw);
      if(!Number.isInteger(result?.amount)||result.amount<100000||result.amount>199000||result.amount%1000!==0)throw Error('Invalid saved lucky envelope');
      return result;
    }
    function open(){
      const saved=read();if(saved)return saved;
      const amount=draw();
      if(!Number.isInteger(amount)||amount<100000||amount>199000||amount%1000!==0)throw Error('Invalid lucky amount');
      const result={amount,openedAt:new Date().toISOString()};
      // Commit before revealing: a failed write never shows a rerollable prize.
      storage.setItem(KEY,JSON.stringify(result));return result;
    }
    return {read,open};
  }
  globalThis.LuckyEnvelope={KEY,create};
})();
