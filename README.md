# Marée — Grand Baie (Demo Site 1)

Homepage for a luxury spa in Grand Baie, Mauritius, built on the Remedy Place design system and published to Instatic **Demo Site 1** (`https://demo-1.3dweb.disruptivedodo.mu/`).

- `site/`: standalone source (`index.html`, `assets/css/maree.css`, `assets/js/maree.js`)
- `docs/remedy-place-analysis.md`: the measured design analysis and how each section was mapped
- `tools/build_instatic.py`: builds `dist/` (Instatic-ready CSS, page sections, module script)
- `tools/preview.js`: headless visual QA. `UPLOADS_DIR=<mirror> node tools/preview.js <out> [url]`
- `tools/montage.py`: tiles QA screenshots into contact sheets
- `tools/serve.js`: QA server with Range support (so video seeking works); `tools/booking_qa.js` drives the booking pop-up end to end
- `motion/`: Remotion project for the ambient scroll films (Tide, Breath, Motes). `cd motion && npm i && npm run render` re-renders them into `site/assets/motion/` as all-intra MP4 and WebM

## Scroll films
The films are light on black. The page screens them onto the luxury-black ground (`mix-blend-mode: screen`), and each section's scroll position picks the frame. Every frame is a keyframe, so seeking is instant. On Instatic they load from this repository through jsDelivr, pinned to a commit (`MOTION_COMMIT` in `tools/build_instatic.py`). After re-rendering, push and bump that hash.

Remotion is free for individuals and companies with up to 3 people. Larger companies need a Remotion company licence: https://www.remotion.dev/license

In Instatic, colours and fonts are site tokens (`--mr-*`, Tenor Sans and Manrope). The stylesheet is `src/styles/maree.css` and the motion runtime is `src/scripts/maree.js` (an ES module that depends on `lenis`).
