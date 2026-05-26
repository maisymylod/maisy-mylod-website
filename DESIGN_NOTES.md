# Design Notes

Redesign of the portfolio in the visual idiom of [codag.ai](https://codag.ai). Tokens, components, and rhythms were lifted directly from codag's stylesheet (gruvbox-dark variant) and adapted for a personal site rather than a product.

## Tokens extracted from codag.ai

Pulled live from `codag.ai/theme.css` (active block) and `codag.ai/styles.css`.

### Color
| Token | Value | Source |
|---|---|---|
| `--bg` | `#282828` | gruvbox dark bg0 |
| `--bg-deep` | `#1d2021` | gruvbox bg0_h (terminals, deep surfaces) |
| `--fg-strong` | `#ebdbb2` | gruvbox fg |
| `--fg-soft` | `#d5c4a1` | text-gray-200/300 remap |
| `--fg-muted` | `#bdae93` | text-gray-400/500 remap |
| `--fg-faint` | `#928374` | gruvbox gray (text-gray-600/700) |
| `--accent` | `#8ec07c` | gruvbox bright aqua-green (primary) |
| `--accent-light` | `#b8bb26` | gruvbox bright green (eyebrows, code prompts) |
| `--cyan` | `#d3869b` | gruvbox bright purple (secondary) |
| `--warning` | `#fabd2f` | gruvbox bright yellow |
| `--error` | `#fb4934` | gruvbox bright red |

### Type
- **Display**: `Newsreader` 400/500/600/700 (codag's `.font-display`)
- **Body**: `Hanken Grotesk` 300–700 (codag's body default)
- **Mono**: `B612 Mono` 400/700 (codag's `.font-mono`)

### Motion
- **Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` (codag's signature out-expo)
- **Reveal**: `opacity 0→1, translateY(24px → 0)` over 800ms
- **Hero stagger**: 0.1s / 0.3s / 0.5s / 0.7s delays

### Radii & rhythm
- Card radius: `0.3rem` (codag's `.card`)
- Code-block radius: `0.25rem`
- Button / CTA radius: `0.12rem` (codag's tightest)
- Section padding: `5.5rem 0` desktop, `3.5rem 0` mobile

## Mapping: codag DNA → personal site

| codag pattern | here |
|---|---|
| Eyebrow label (mono, small, accent-light) | Every chapter eyebrow |
| Two-line headline (bold + muted second line) | `.headline` with `.dim` span |
| Hero centerpiece animation (logs → capsule) | Spectral graph mess → partitioned communities |
| Install command in hero | `pip install networkx scipy && python spectral_demo.py` |
| Final-CTA echo of hero command | `git clone https://github.com/maisymylod` |
| Compare-card split (left muted, right bright) | Showpiece raw graph (left) vs partitioned (right) |
| Pipeline / cycling text ("wrap anything") | "The stack" rotating list of systems |
| Grain overlay (SVG noise, 0.022 opacity) | Same, page-wide |
| Hero glows (accent + cyan radial gradients) | Same, only on hero section |
| Marquee at top | Keyword strip (pauses on hover) |

## Showpiece — spectral graph community detection

Why this one over GBM or persistent homology: it has the strongest mess → structure visual contrast, mapping onto codag's "26.6M tokens → 3,317 tokens" before/after. Two canvases run independent force-directed simulations against the same planted-partition graph; left mode has no community pull, right mode pulls each node toward its community anchor on a circle, with edges between communities thinning and within-community edges adopting the community color. Stat callout: **60 nodes → 4 communities**.

Reduced-motion path: settles each simulation for 200 frames and paints a single frame, then returns.

## Files

- `index.html` — single-page narrative (hero + 7 chapters)
- `experience.html`, `projects.html`, `dashboard.html`, `contact.html` — restyled with shared idiom, keyboard nav preserved
- `theme.css` — design tokens only
- `styles.css` — components
- `script.js` — shared interactions (nav, palette, counters, reveals, marquee, copy-cmd, showpiece, math demos)
- Page-specific JS lives inline at the bottom of `projects.html`, `dashboard.html`, `contact.html`

## Libraries

| Lib | Where | Why |
|---|---|---|
| Chart.js 4 (CDN) | Dashboard only | Existing dashboard charts; ~30KB gzipped, loaded with `defer` |
| Google Fonts: Newsreader, Hanken Grotesk, B612 Mono | All pages | codag's exact typography |

No build step. Everything ships as static files on GitHub Pages.

## Acceptance checklist

- [x] **Zero hardcoded 0 counters.** Counters render `0` initially as placeholder and animate to real values (`1219`, `733`, `196`, `11`) via IntersectionObserver. Real values come from the inventory of the live site.
- [x] **Reduced-motion path.** A global `prefers-reduced-motion` block kills durations/animations. Showpiece, math demos, marquee, blink, and pulse all branch to a non-animated final state. Fade-in items appear immediately.
- [x] **Mobile reflow.** Compare-grid collapses to single column at 760px. Stat grid goes 4 → 2 → 1. Role-head wraps. Nav becomes a hamburger menu. Marquee continues to work.
- [x] **Keyboard navigation.** Cmd/Ctrl-K opens command palette; ↑/↓ navigate; Enter selects; Esc closes. Sections that exist on the current page can be jumped to.
- [x] **Animate only transform + opacity.** All reveal/hero/lift animations use `transform` and `opacity`. No animated layout properties.
- [x] **IntersectionObserver, not scroll listeners.** Used for reveals and counters; one rAF-throttled scroll handler for nav-hide + progress.
- [x] **No layout shift on showpiece.** Compare-side has `min-height: 360px` so the canvas slot is reserved before the canvas paints.
- [x] **Accessibility.** Semantic landmarks (`<nav>`, `<header>`, `<main>`, `<footer>`, `<section>`, `<article>`); aria-labels on nav and palette; `:focus-visible` ring; alt text via aria-label on decorative canvases (marked `aria-hidden`).

## How to verify locally

```
cd maisy-mylod-website
python3 -m http.server 8765
open http://127.0.0.1:8765/
```

Then:
1. Watch the hero showpiece animate (left side tangled, right side colored partitions).
2. Scroll down — counters should tick from 0 to their real values on first viewport entry.
3. Hover the top marquee — it should pause.
4. Press Cmd/Ctrl-K — palette opens; arrow keys cycle; Enter scrolls to or navigates to the selection.
5. Resize to ≤760px — showpiece stacks vertically, nav becomes hamburger.
6. Toggle macOS *Reduce motion* (or Chrome devtools rendering tab → emulate `prefers-reduced-motion`) and reload — animations should not run.
