# Design Notes

A formal, editorial redesign: ink on warm paper, restrained motion, and a hard rule
that every number on the site regenerates from a committed eval.

## The brief

Optimize for a technical reader evaluating engineering judgment. That pushed three
decisions:

1. **Positioning.** The spine of the site is human-in-the-loop systems and the
   evaluation that measures them, not the satellite-simulation framing the previous
   version led with. The production correction loop is the hero showpiece because it
   is the most load-bearing thing here: real annotators who are not engineers,
   correcting data the business depends on.
2. **Honesty as a design constraint.** Every metric is paired with the repository and
   the command that regenerates it. Where a number needs hardware that has not been
   rented (`groundstation-train`'s SFT+DPO lift), the site says pending rather than
   claiming it, and says so in the same weight of type as the wins.
3. **Formal, not decorative.** Sentence case, serif display, hairline rules, generous
   whitespace. Motion is present but purposeful: nothing bounces, nothing loops for
   attention.

## Tokens

All in `theme.css`. Edit only that file to retune.

### Colour

Colour is used to mean something and never as decoration.

| Token | Value | Job |
|---|---|---|
| `--paper` | `#faf8f4` | the base sheet |
| `--paper-sunk` | `#f2eee6` | recessed bands, alternating sections |
| `--paper-raised` | `#ffffff` | cards lifted off the sheet |
| `--paper-ink` | `#1c1a16` | inverted panels (final CTA) |
| `--ink` / `--ink-soft` / `--ink-muted` / `--ink-faint` | `#17150f` → `#97917f` | four-step prominence ladder |
| `--accent` | `#9c4221` | **the human in the loop**; links; emphasis |
| `--measure` | `#2f5d4f` | **a number produced by running the code** |
| `--rule` / `--rule-strong` / `--rule-faint` | ink at 13% / 26% / 7% | structure |

The two semantic colours are the whole system. A sienna mark means a human decided
something; a green mark means the figure beside it came out of a held-out eval.

### Type

- **Display**: Newsreader 400/500/600 — headlines, stat figures, role names
- **Body**: Hanken Grotesk 300–700
- **Mono**: JetBrains Mono 400/500 — labels, filenames, measured values, repo names

Repository names are always set in mono, so the reader can tell at a glance what is
a real artifact they can go read.

### Motion

- Easing `cubic-bezier(0.16, 1, 0.3, 1)` (out-expo) throughout
- Reveal: `opacity 0→1`, `translateY(14px → 0)` over 900ms
- Stagger: 70ms per child, capped at 420ms, written as `--d` by `script.js`

## Layout: the spine

Most sections use an asymmetric editorial grid — a 168px left rail carrying the
section label and a one-line note, and a wide content column. The rail is `sticky`
so the label stays with its section while reading. Below 900px the rail stacks above
the content.

## The showpiece: the correction loop

An inline SVG of the four-stage cycle from the production system: system of record →
inline correction by a non-engineer → override store → human review → merged back.
The two human stages carry the accent wash, and the feedback edge that returns an
accepted correction to the source of truth is the one accent-stroked edge.

Animation: each edge draws itself in via `stroke-dashoffset` on a 190ms stagger,
nodes fade in behind them, then a single packet circulates the loop at 58 px/s —
slow enough to follow, quiet enough to ignore.

Reduced motion: the stylesheet clears the dash properties so the edges are solid from
the first paint, nodes start visible, and the packet never starts.

## Charts (`dashboard.html`)

The previous dashboard showed invented visitor analytics behind a small "illustrative"
disclaimer. On a site whose thesis is that every number regenerates, that was a
liability, so it was replaced with real GitHub contribution data read from the API on
4 August 2026, with the regenerating command printed on the page.

Chart colours were validated rather than eyeballed, with the `dataviz` skill's
validator against the `#ffffff` card surface:

```
node scripts/validate_palette.js "#9c4221,#2a78d6" --mode light --surface "#ffffff"
  [PASS] Lightness band · [PASS] Chroma floor · [PASS] CVD separation (worst deutan ΔE 26.1)
  [PASS] Normal-vision floor (ΔE 28.9) · [PASS] Contrast vs surface
```

An earlier candidate (`#9c4221` + the site's `--measure` green) failed: the green fell
below the chroma floor and the pair sat at CVD ΔE 6.3. Do not re-pick these by eye.

Chart rules followed: single-series charts carry no legend (the card title names the
series), the two-series chart has a legend plus direct labels underneath, no chart has
two y-scales, and grid lines appear on the value axis only.

## Files

- `theme.css` — tokens only
- `styles.css` — components
- `script.js` — one IIFE, no globals: reveals, counters, meters, nav, palette, copy, loop diagram
- `index.html` — hero, approach, measured, selected work, experience, output, CTA
- `experience.html`, `projects.html`, `dashboard.html`, `contact.html`
- Page-specific JS is inline at the bottom of `projects.html`, `dashboard.html`, `contact.html`

No build step. Static files on GitHub Pages.

## Acceptance checklist

- [x] **Content matches the resume.** CLEAR is Jan 2024 – Jan 2025 (the old site said Jan–Sep 2025), Goldsmith is AI Lead & Software Engineer, and Athena and MoMath are present.
- [x] **Stats are real.** 2,590 contributions / 1,744 commits / 638 PRs / 48 reviews / 93 issues, read from the GitHub contributions API for the trailing 12 months on 4 August 2026.
- [x] **No fabricated data anywhere.** The invented analytics dashboard is gone.
- [x] **Every headline metric names its repository and its regenerating command.**
- [x] **Pending is labelled pending.** `groundstation-train`'s model lift is not claimed.
- [x] **Reduced motion.** Reveals, counters, meters, the loop diagram, the beacon, and the charts all branch to a static final state.
- [x] **No horizontal overflow.** Verified at a 375px viewport on all five pages (`scrollWidth === clientWidth`).
- [x] **Animate transform and opacity only**, plus `stroke-dashoffset` and the single `width` transition on `.meter`.
- [x] **One scroll listener**, rAF-throttled, driving the nav and the progress rule. Everything else is IntersectionObserver.
- [x] **Keyboard.** ⌘/Ctrl-K opens the palette; ↑/↓/Enter/Esc; `g` then `h/e/p/d/c` jumps between pages.
- [x] **Accessibility.** Semantic landmarks, `aria-label` on the SVG diagram and every chart canvas, `:focus-visible` rings, and a `forced-colors` block.

## Verify locally

```
cd maisy-mylod-website
python3 -m http.server 8765
open http://127.0.0.1:8765/
```

Then: watch the loop diagram draw in and the packet start; scroll so the counters and
the measured meters run; press ⌘K; narrow to 390px; and toggle *Reduce motion* to
confirm every animation lands on its final state instead of being skipped.
