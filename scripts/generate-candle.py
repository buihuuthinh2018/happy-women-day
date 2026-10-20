"""Render an original code-drawn candle animation, plus reduced-motion stills."""
from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import math, random

SIZE=480
OUT=Path(__file__).resolve().parents[1]/'dist'/'assets'
random.seed(20)
stars=[(random.randrange(45,440),random.randrange(45,380),random.random()*math.tau) for _ in range(16)]

def ellipse_glow(canvas,box,color,blur):
    layer=Image.new('RGBA',canvas.size)
    ImageDraw.Draw(layer).ellipse(box,fill=color)
    canvas.alpha_composite(layer.filter(ImageFilter.GaussianBlur(blur)))

def rose(draw,x,y,r):
    for layer in range(5):
        radius=r*(1-layer*.17)
        for n in range(5):
            a=n/5*math.tau+layer*.7
            cx=x+math.cos(a)*radius*.35;cy=y+math.sin(a)*radius*.3
            color=[(118,61,76),(146,80,94),(167,102,113),(190,130,139),(209,153,159)][layer]
            draw.ellipse((cx-radius*.65,cy-radius*.55,cx+radius*.65,cy+radius*.55),fill=color)

def frame(t,lit=True):
    im=Image.new('RGBA',(SIZE,SIZE),(50,43,37,255))
    power=.85+.1*math.sin(t)+.05*math.sin(t*3)
    if lit:
        ellipse_glow(im,(125,10,355,300),(197,132,57,int(22*power)),48)
        ellipse_glow(im,(190,55,290,173),(255,185,73,int(30*power)),30)
    draw=ImageDraw.Draw(im)
    # Quiet botanical silhouettes and blush roses, drawn as native geometry.
    for x,y,angle in [(114,350,-.6),(136,374,.3),(340,369,.5),(366,345,-.4)]:
        draw.line((x,y,x+math.sin(angle)*55,y-85),fill=(100,105,72),width=2)
        for i in range(3):
            yy=y-i*23
            draw.ellipse((x-25,yy-18,x+2,yy-7),fill=(88+i*5,94+i*4,65))
            draw.ellipse((x+2,yy-30,x+29,yy-19),fill=(100+i*4,102+i*3,72))
    ellipse_glow(im,(131,380,357,429),(0,0,0,70),15)
    draw=ImageDraw.Draw(im)
    draw.ellipse((131,382,349,419),fill=(108,82,49),outline=(178,142,87),width=2)
    draw.ellipse((140,382,340,409),fill=(147,115,68),outline=(192,156,99),width=1)
    # Ivory pillar with a cylindrical wax gradient.
    for x in range(180,301):
        light=math.sin((x-180)/120*math.pi)*28
        draw.line((x,182,x,389),fill=(int(209+light),int(190+light),int(153+light)),width=1)
    draw.ellipse((180,378,300,401),fill=(215,195,157))
    draw.ellipse((180,171,300,195),fill=(237,218,178),outline=(201,175,128))
    draw.ellipse((199,177,281,190),fill=(215,191,148))
    draw.ellipse((222,180,258,188),fill=(162,133,93))
    draw.rounded_rectangle((197,186,209,235),radius=6,fill=(237,218,181))
    draw.rounded_rectangle((273,186,281,219),radius=4,fill=(223,203,166))
    draw.line((240,182,240,168),fill=(62,44,30),width=3)
    draw.line((207,267,273,267),fill=(168,137,96),width=1)
    draw.line((219,318,261,318),fill=(168,137,96),width=1)
    # Heart engraved into the wax.
    draw.arc((226,277,241,291),180,360,fill=(151,111,86),width=2)
    draw.arc((240,277,255,291),180,360,fill=(151,111,86),width=2)
    draw.line((226,284,240,304,255,284),fill=(151,111,86),width=2)
    rose(draw,130,378,31);rose(draw,349,394,27);rose(draw,365,362,21)
    draw.ellipse((162,419,184,429),fill=(177,111,127));draw.ellipse((294,423,319,432),fill=(202,145,152))
    if lit:
        sway=math.sin(t)*3+math.sin(t*2)*1.5
        height=49+math.sin(t*3)*4
        ellipse_glow(im,(218,125,262,180),(255,198,79,110),13)
        draw=ImageDraw.Draw(im)
        tip=(240+sway,169-height)
        draw.polygon([(231,161),(230,147),tip,(251,147),(249,163),(242,173),(237,171)],fill=(244,170,64))
        draw.ellipse((232,143,249,172),fill=(255,213,111))
        draw.ellipse((236,150,245,171),fill=(255,247,206))
        for x,y,p in stars:
            brightness=int(110+70*(.5+.5*math.sin(t+p)))
            draw.ellipse((x,y,x+1.5,y+1.5),fill=(brightness,int(brightness*.78),int(brightness*.5)))
    return im.convert('RGB')

OUT.mkdir(exist_ok=True)
frame(0,False).save(OUT/'candle-still.png',optimize=True)
frame(0).save(OUT/'candle-lit.png',optimize=True)
frames=[frame(i/36*math.tau) for i in range(36)]
palette=frames[0].quantize(colors=128)
frames=[f.quantize(palette=palette,dither=Image.Dither.NONE) for f in frames]
frames[0].save(OUT/'candle-glow.gif',save_all=True,append_images=frames[1:],duration=80,loop=0,optimize=True,disposal=1)
gif=Image.open(OUT/'candle-glow.gif')
print(f'Generated {gif.n_frames} GIF frames at {gif.size}, {(OUT/"candle-glow.gif").stat().st_size} bytes')
