// Keep app gestures inside the paper, away from browser/OS edge navigation.
(() => {
  function canStart({x,y,width,height,paper,interactive=false,busy=false,touches=1,scale=1}) {
    if(interactive||busy||touches!==1||scale>1.01)return false;
    const left=Math.max(44,paper.left+18),right=Math.min(width-44,paper.right-18);
    const top=Math.max(50,paper.top),bottom=Math.min(height-88,paper.bottom);
    return x>=left&&x<=right&&y>=top&&y<=bottom;
  }
  function intent(dx,dy) {return Math.abs(dx)>14&&Math.abs(dx)>Math.abs(dy)*1.4;}
  function forward(dx,dy,elapsed) {return elapsed<=1400&&dx<=-55&&Math.abs(dx)>Math.abs(dy)*1.4;}
  globalThis.LetterGestures={canStart,intent,forward};
})();
