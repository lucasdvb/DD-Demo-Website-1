# Remedy Place → Marée: design analysis

Source: `https://www.remedyplace.com/`, captured 13 Oct 2026 with headless Chromium (1440×900 and 390×844). Values below were read from the computed styles and the production stylesheet, not estimated by eye.

## Platform
- Next.js (pages router) with Tailwind, and Sanity as the CMS for images and video.
- Locomotive-style smooth scroll (`html.has-scroll-smooth`). No GSAP or Lenis.
- Termly handles cookie consent and Klaviyo handles forms.

## Colour (dark, warm, almost no hue)
| Role | Value | Where it is used |
|---|---|---|
| Page ground | `#1a1817` | body, most sections |
| Deep ground | `#141210` | footer |
| Band | `#000000` | "Our clubs" band |
| Panel | `#4b443c` | experience-card hover panel, button borders |
| Hairline | `#403b36` | rules |
| Body / section titles | `#b9b2aa` | paragraphs, nav, H2 |
| Display | `#edecea` | H1, card titles |
| Cream | `#fdfaf1` (80% alpha) | Book pill |
| Primary button | `#cdc9c2` | "Reservations" fill |
| Ink on light | `#30251c` | Book pill text and border |
| Muted | `#978a7c`, `#908b83`, `#beb1a4` | labels |

## Type
- **Display: Beausite Slick 400, uppercase.** Sizes: H1 47.5px / 1.0; section H2 36px / 1.2 in taupe; card title 24.5px in bone; tracking normal.
- **Body: Beausite Classic.** 16 / 24 at weight 400, or 300 with 0.4px tracking for light-on-image copy.
- **UI:** nav 14px uppercase with 0.35px tracking; buttons 14px uppercase with 1.4px (0.1em) tracking; footer heads 14px / 700.
- Beausite is a commercial Fatype family. The rebuild uses **Tenor Sans** (display) and **Manrope** (body), the closest free Google pairing. Swap in Beausite if it is licensed.

## Layout and spacing
- 65px side gutter on a 1440 viewport. Header is 117px tall: logo on the left, nav and Book pill on the right.
- Content widths: 1310px for card rows, 1180px for the experience grid, 720px for the intro paragraph.
- Cards: 293×500 portrait cards with a 12px radius in rows of four (16px gap). Experience tiles are about 380×360 in a 3-column grid. Ghost buttons are 51px tall with 40px side padding.
- Section order: hero (full-bleed video, centred H1 and button) → centred intro paragraph → "Our clubs" four cards on black → editorial mosaic → "Remedy categories" four cards → full-bleed "Our remedies" image band with left copy → "Experiences reserved privately…" twelve-tile grid, where each tile flips to a `#4b443c` panel with a description on hover → closing CTA band → "As seen in" ticker → four-column footer.

## Motion
- Reveals use `cubic-bezier(0.19, 1, 0.22, 1)` (expo-out) over **2s**, delayed 0.7–1s. The header colour transition is 3s, UI transitions are 0.15–0.3s, and the press ticker runs on a 10s linear loop.

## How Marée maps it
| Remedy Place | Marée (Grand Baie) |
|---|---|
| Self-care made social | Self-care, shaped by the tide |
| Our clubs (4 cities) | The House: Lagoon Pavilions, Bathhouse, Contrast Circuit, Breath Deck |
| Remedy categories | Island Rituals, Bodywork, Hydrotherapy, Stillness |
| Our remedies (red-light image) | Our rituals, over GetLayers' **Mere** water shader tinted to the palette |
| 12 experiences | Basalt stone, Bourbon vanilla, sugarcane & sea-salt, Chamarel earth facial, ylang-ylang, Ayurvedic shirodhara, lagoon contrast circuit, salt bath & steam, lymphatic drainage, sunrise breathwork, sound bath at dusk, couples pavilion |
| As seen in (press) | From the island: ingredient ticker (no invented press) |
| Memberships (nav) | Membership plates: Day Ritual, Island Member, Resident |

## GetLayers pieces used
- **Compositions:** `halcyon-hero` (centred beat over full-bleed media), `artist-acquire` (membership plates), `artist-footer` (inverted footer with bleeding wordmark), `lumora-services` and `stride-showcase` as references for the card rails.
- **Gradient:** `mere`. The shader is unchanged; only its CONFIG colours were re-tinted (`#0e0c0b / #211e1c / #4b443c / #8f9a93 / #edecea`).
- **Reveal choreography:** veil loader with no fake counter; the gate flips at the start of the curtain exit; split-word hero rise with protected descenders; viewport reveals fire once; reduced motion stops the canvas loop too.
