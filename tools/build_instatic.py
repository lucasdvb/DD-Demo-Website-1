"""Split site/ into the pieces pushed to Instatic.

dist/instatic.css      — maree.css with colour vars removed (Instatic colour tokens own
                         them) and font vars pointed at Instatic's font tokens.
dist/sections/NN.html  — the page body split into top-level blocks, inserted one by one
                         under the .mr-page wrapper.
"""
import os, re

ROOT = os.path.join(os.path.dirname(__file__), '..')
css = open(os.path.join(ROOT, 'site/assets/css/maree.css')).read()

colour_vars = ['mr-ink', 'mr-ink-deep', 'mr-night', 'mr-panel', 'mr-line', 'mr-taupe', 'mr-stone',
               'mr-bone', 'mr-cream', 'mr-sand', 'mr-umber', 'mr-lagoon']
for v in colour_vars:
    css = re.sub(rf'\n  --{v}:[^;]+;[^\n]*', '', css)
css = css.replace('--mr-font-display: "Tenor Sans"', '--mr-font-display: var(--font-mr-font-display), "Tenor Sans"')
css = css.replace('--mr-font-body: "Manrope"', '--mr-font-body: var(--font-mr-font-body), "Manrope"')

os.makedirs(os.path.join(ROOT, 'dist/sections'), exist_ok=True)
open(os.path.join(ROOT, 'dist/instatic.css'), 'w').write(css)

html = open(os.path.join(ROOT, 'site/index.html')).read()
body = html.split('<!-- BODY START -->')[1].split('<!-- BODY END -->')[0]
inner = body.split('<div class="mr-page" id="top">', 1)[1].rsplit('</div>', 1)[0]
inner = re.sub(r'<!--.*?-->', '', inner, flags=re.S)

# top-level blocks of .mr-page; <main> is expanded into its sections
blocks, depth, start = [], 0, None
for m in re.finditer(r'<(/?)([a-z0-9]+)[^>]*?(/?)>', inner):
    closing, tag, selfclose = m.group(1), m.group(2), m.group(3)
    if tag in ('img', 'input', 'br', 'path', 'meta', 'link') or selfclose:
        continue
    if not closing:
        if depth == 0: start = m.start()
        depth += 1
    else:
        depth -= 1
        if depth == 0: blocks.append(inner[start:m.end()])
out = []
for b in blocks:
    if b.startswith('<main'):
        out.append('<main class="mr-main"></main>')
        sub = b[b.index('>') + 1: b.rindex('</main>')]
        d, s0 = 0, None
        for m in re.finditer(r'<(/?)([a-z0-9]+)[^>]*?(/?)>', sub):
            c, t, sc = m.group(1), m.group(2), m.group(3)
            if t in ('img', 'input', 'br', 'path') or sc: continue
            if not c:
                if d == 0: s0 = m.start()
                d += 1
            else:
                d -= 1
                if d == 0: out.append('MAIN:' + sub[s0:m.end()])
    else:
        out.append(b)
for f in os.listdir(os.path.join(ROOT, 'dist/sections')):
    os.remove(os.path.join(ROOT, 'dist/sections', f))
for i, b in enumerate(out):
    open(os.path.join(ROOT, f'dist/sections/{i:02d}.html'), 'w').write(re.sub(r'\n\s+', '\n', b).strip())
    print(i, len(b), b[:70].replace('\n', ' '))
