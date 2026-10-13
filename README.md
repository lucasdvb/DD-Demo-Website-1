# Marée — Grand Baie (Demo Site 1)

Homepage for a luxury spa in Grand Baie, Mauritius, built on the Remedy Place design system and published to Instatic **Demo Site 1** (`https://demo-1.3dweb.disruptivedodo.mu/`).

- `site/`: standalone source (`index.html`, `assets/css/maree.css`, `assets/js/maree.js`)
- `docs/remedy-place-analysis.md`: the measured design analysis and how each section was mapped
- `tools/build_instatic.py`: builds `dist/` (Instatic-ready CSS, page sections, module script)
- `tools/preview.js`: headless visual QA. `UPLOADS_DIR=<mirror> node tools/preview.js <out> [url]`
- `tools/montage.py`: tiles QA screenshots into contact sheets

In Instatic, colours and fonts are site tokens (`--mr-*`, Tenor Sans and Manrope). The stylesheet is `src/styles/maree.css` and the motion runtime is `src/scripts/maree.js` (an ES module that depends on `lenis`).
