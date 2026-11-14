# რა? სად? როდის? — სკოლის ვერსია · Brand guidelines

## Idea
A dark, quiet hall with one warm light over a round table. The look borrows the *feeling*
of the classic TV game — candle-warm brass on ink black, a ring of sectors, a spinning arrow —
without copying any broadcaster's logo or artwork. The arrow-and-sector ring is our own mark.

## Voice
- Georgian first. Short, formal, calm: «ყურადღება, კითხვა!», «დრო!», «პასუხი».
- Headings use Mtavruli (ᲛᲗᲐᲕᲠᲣᲚᲘ) capitals, letter-spaced, in brass.
- Never show the question text on the projector — the host reads it aloud.

## Colour (primitive → semantic)
| Primitive | Hex | Semantic use |
|---|---|---|
| ink-950 | `#070605` | projector background |
| ink-900 | `#0d0b09` | panel background |
| ink-800 | `#1a1713` | cards, inputs |
| ink-700 | `#26221c` | borders |
| stone-400 | `#8f8576` | muted text (≥4.5:1 on ink-900) |
| parchment-100 | `#f3ece0` | primary text |
| brass-400 | `#e3b65c` | accent, numerals, focus ring |
| brass-300 | `#f0d48f` | highlight |
| ember-400 | `#ff6b4a` | last 10 seconds, destructive |
| sage-400 | `#5fd39a` | correct answer (control panel only) |

Gold numerals use a vertical brass gradient (`--gradient-brass`). Red appears on the projector
only during the last 10 seconds of the timer.

## Type
| Role | Family | Notes |
|---|---|---|
| Display / Mtavruli headings / answers | Noto Serif Georgian (variable 100–900) | supports Mkhedruli + Mtavruli |
| UI, body, team names | FiraGO | very legible Georgian sans, used for controls |
| Numerals (question number, scores, timer) | Playfair Display (variable 400–900) | high-contrast Didone-style, flagged «1» stays readable at a distance; lining + tabular figures |

All fonts are bundled locally (no internet needed at the event).

## Projector rules
- Everything on the projector is sized in `vh`/`vmin`, so it scales from 4:3 1024×768 up to 4K.
- Minimum projected text: 2.2vh. Answers auto-fit by length.
- Motion: 300–700 ms ease-out; respects `prefers-reduced-motion`.
