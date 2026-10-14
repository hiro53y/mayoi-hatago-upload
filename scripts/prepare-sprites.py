"""元の絵（GPT生成の透過PNG）を、ゲームで使う大きさ（192px の正方形）に整える。開発時に1回だけ実行する。
python scripts/prepare-sprites.py
"""
import os
from PIL import Image

SRC = os.path.join(os.path.dirname(__file__), '..', 'public', 'assets', 'sprites')
OUT = os.path.join(SRC, 'v2')
SIZE = 192

def square(im, pad=0.06):
    im = im.convert('RGBA')
    box = im.getbbox()
    im = im.crop(box)
    w, h = im.size
    side = int(max(w, h) * (1 + pad * 2))
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    # 足元をそろえるため、下寄せで置く
    canvas.paste(im, ((side - w) // 2, side - h - int(side * pad)))
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)

os.makedirs(OUT, exist_ok=True)
names = ['player-down', 'player-up', 'player-left', 'player-right', 'enemy-tanuki', 'enemy-kitsune', 'enemy-armor', 'enemy-onibi', 'enemy-kappa',
         'enemy-rust-armor', 'enemy-shadow', 'item-herb', 'item-food', 'item-weapon', 'item-armor', 'item-offense', 'item-support', 'stairs']
for name in names:
    square(Image.open(os.path.join(SRC, name + '.png'))).save(os.path.join(OUT, name + '.png'), optimize=True)

# 罠3種は元のスプライトシートの右下から切り出す
sheet = Image.open(os.path.join(SRC, 'spritesheet-transparent.png')).convert('RGBA')
cell = sheet.crop((930, 850, 1402, 1080))
alpha = cell.split()[3]
w, h = cell.size
cols = [any(alpha.getpixel((x, y)) > 30 for y in range(h)) for x in range(w)]
segs, start = [], None
for x, c in enumerate(cols + [False]):
    if c and start is None:
        start = x
    if not c and start is not None:
        if x - start > 20:
            segs.append((start, x))
        start = None
print('trap segments', segs)
for name, (a, b) in zip(['trap-spike', 'trap-net', 'trap-fire'], segs):
    square(cell.crop((a, 0, b, h))).save(os.path.join(OUT, name + '.png'), optimize=True)
print('done', sorted(os.listdir(OUT)))
