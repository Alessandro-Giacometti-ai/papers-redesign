# DESIGN.md

Visual system of this site, recorded from the built pages. Direction: a backtest tearsheet
(quant report page) rather than a blog list. Seed key 08b092de.

## Surface and color
- Ground `--paper #f5f6f4`, secondary ground `--paper-2 #eceeea` (chart section).
- Ink `#0f1419`, secondary `#3a424b`, tertiary `#5c6570` (labels, muted meta).
- One action color: `--blue #1749d6` (hover) and `--blue-ink #0f36a8` (links at rest).
- One loss color: `--red #c8321f` for "Key result" labels and drawdown fill.
- Eight regime fills for the chart only, at 16 percent alpha: blue, red, magenta,
  orange, teal, gray, violet, green (see `assets/js/regimes.js`).
- Rules are 1px, `--rule #cfd4d0` and `--rule-soft #e1e4e0`; section heads use ink rules.
- No border radius, no shadows, no gradients. Single light look; no dark theme.

## Type
- Archivo (variable, width axis) for everything. Body 17px/1.55 at width 100.
  Display headings weight 700, letter-spacing -0.02em, width 94 to 96.
  Labels: width 80, weight 600, 12px, uppercase, tracking 0.08em.
- Fragment Mono for measured values: ids, dates, counts, tags, BibTeX, code.
- Fonts are self-hosted from `static/fonts/` (OFL).

## Layout
- Wrapper `min(100% - 48px, 1240px)`. Section head 5/7 split; entry rows 3/7/2
  (meta, title and summary, tags); single pages 8/4 head and 8/3 body.
- Below 1000px every grid collapses to one column; below 720px the header stacks.
- Space above headings is larger than below; entries separate with 1px rules.

## Components
- Entry row: meta strip in mono with keys (SSRN, Code, Date, Lang), title as the row link
  (whole row clickable via `::before`), summary, action links with arrow, tag chips.
- Buttons: 1px ink border, square, ink fill on hover or when pressed; `.primary` filled.
- Key result: red label plus one sentence, used on project pages and list rows.
- Regime chart: canvas, synthetic path, three states (original, IID, regime), one animated
  transition of 900ms with exponential ease-out; honors `prefers-reduced-motion`.
- Code blocks and BibTeX: ink background, light text, copy button top right.

## Content rules
- All facts come from front matter or markdown; the chart is labelled as synthetic.
- New papers need `ssrn`, `language`, optional `alternate` and `project` in front matter.
- New projects need `repo`, `keyResult`, optional `papers`.
