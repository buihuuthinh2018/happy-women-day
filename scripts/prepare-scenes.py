from pathlib import Path
import json
p=Path('dist/app.js')
s=p.read_text(encoding='utf-8')
if 'function render(data)' in s:
    p.write_text(s[:s.index('function render(data)')],encoding='utf-8')
p=Path('dist/greeting.json')
d=json.loads(p.read_text(encoding='utf-8'))
d['candle']['animation']='assets/candle-glow.gif'
d['candle']['poster']='assets/candle-still.png'
d['music']={'src':'','volume':0.4,'loop':True}
p.write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
