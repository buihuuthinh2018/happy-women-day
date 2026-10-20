// Keep app gestures inside the paper, away from browser/OS edge navigation.
(() => {
  function canStart({x,y,width,height,paper,interactive=false,busy=false,touches=1,scale=1}) {
    if(interactive||busy||touches!==1||scale>1.01)return false;
    const left=Math.max(44,paper.left+18),right=Math.min(width-44,paper.right-18);
    const top=Math.max(50,paper.top),bottom=Math.min(height-88,paper.bottom);
    return x>=left&&x<=right&&y>=top&&y<=bottom;
  }
  globalThis.LetterGestures={canStart};
})();
