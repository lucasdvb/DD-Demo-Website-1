"""Tile QA screenshots into 2x2 sheets: python3 tools/montage.py <dir> <prefix> [scale]"""
import glob, sys
from PIL import Image
d, prefix = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
fs = sorted(glob.glob(f"{d}/{prefix}-*.png"))
for i in range(0, len(fs), 4):
    ims = [Image.open(f).convert("RGB") for f in fs[i:i + 4]]
    w, h = int(ims[0].width * scale), int(ims[0].height * scale)
    m = Image.new("RGB", (w * 2 + 6, h * 2 + 6), (255, 255, 255))
    for j, im in enumerate(ims):
        m.paste(im.resize((w, h)), ((j % 2) * (w + 6), (j // 2) * (h + 6)))
    m.save(f"{d}/sheet-{prefix}-{i // 4}.png")
    print(f"{d}/sheet-{prefix}-{i // 4}.png", [f.split('/')[-1] for f in fs[i:i + 4]])
