# Design

<!-- impeccable:design-schema 1 -->

The visual system for peptide-RX. This documents a world that already existed
in code and was chosen deliberately; it is a record, not a proposal. The
direction contract it derives from lives in the header of `src/theme.ts`
(seed `02d0b60b`).

## Direction

**A recovery instrument for an active peptide protocol** — the readout you
check like a wearable, not a form you fill like a clinic.

The owner's words, which outrank any generic design checklist here:

> informative and medical — it shouldn't look like a toy.

That has a concrete consequence. The dense readouts — large numerals, tracked
uppercase section labels, stat pairs, the adherence ring — **are the product**.
A critique list that flags them as a "hero-metric template" or "eyebrow labels"
is wrong for this app. Apply such lists to mechanics only: contrast, states,
touch targets, drawn icons, spacing rhythm, type scale. Never to strip
informational density.

A neo-brutalist re-skin was built in full and rejected (`850699e`, reverted in
`8d3f6a1`). A segmented dose meter replacing the adherence ring was trialled
and rejected (`555f0a3`, reverted in `f675d5b`) — the ring stays because it is
the only round form on a screen of rectangles and carries the visual rhythm.
Do not re-propose either.

## Ground and surfaces

One step of elevation, hairline seams, never shadow stacks.

| Token | Value | Use |
|---|---|---|
| `bg` | `#0E1114` | Page ground |
| `panel` | `#151A1F` | Panels, the one elevation step |
| `panelRaised` | `#1B2129` | Inputs and wells inside a panel |
| `hairline` | `#262D35` | Seams between rows and panel edges |
| `hairline2` | `#39424D` | Stronger edge: inputs, secondary buttons |

Radius by role: `sm 8` wells · `md 12` controls · `lg 16` cards · `xl 20` panels.

## Ink

| Token | Value | Use |
|---|---|---|
| `ink` | `#EAEEF2` | Primary text and numerals |
| `ink2` | `#A9B4BF` | Body copy, secondary |
| `ink3` | `#8A96A3` | Labels, metadata, placeholders |

`ink3` is the dimmest step that still clears 4.5:1 on both the page ground and
the panel. It was raised from `#6E7A86` (3.7:1) for exactly that reason.
Anything quieter is a hairline, not text.

## Colour meanings

Colour is never decorative here; each one means one thing.

- **`signal` `#35E39B`** — adherence and the primary action. Nothing else.
- **`trace` `#52C4FF`** — data lines and charts only. Never a control.
- **`amber` `#F5B84A`** — off-cycle, overused site, a miss. Attention, not failure.
- **`red` `#F27070`** — errors and destructive actions.

State is always **a drawn mark plus colour**, never hue alone — see the
`Mark*` icons, which differ in shape as well as tint.

## Type

Barlow for the UI voice, Barlow Semi-Condensed for instrument numerals.

**The ramp is nine steps: 11 / 13 / 15 / 17 / 20 / 24 / 32 / 38 / 52.** No
half-points, no per-screen nudging. The jumps are deliberate so a role is
recognisable without reading the copy.

Roles are named for the job, not the size — a screen asks for `type.statLg`,
never for 38px:

| Role | Size | Use |
|---|---|---|
| `display` | 52 | The adherence ring numeral |
| `statLg` / `statMd` / `statSm` | 38 / 32 / 20 | Instrument readouts |
| `title` | 24 | Screen title |
| `heading` / `headingSm` | 17 / 15 | Panel and row headings |
| `body` / `bodySm` | 15 / 13 | Reading |
| `label` | 11 | Tracked uppercase section label |
| `meta` / `metaSm` | 13 / 11 | Supporting detail |
| `button` / `buttonSm` | 15 / 13 | Controls |
| `error` | 13 | The single error voice |

Light text on a near-black ground carries slightly more line height and
tracking than the same face would on white. That compensation lives in
`theme.ts`, once.

## Spacing

**A 4pt grid**, through `space`: `xs 4 · sm 8 · md 12 · lg 16 · xl 20 ·
xxl 24 · section 32 · screen 40`. The steps widen at the top so separation
between groups outruns separation within one.

Tight groups, generous separation, more room above a heading than below it.
1–3pt values are hairlines and optical offsets, not spacing decisions.

## Icons

Drawn SVG in `src/components/icons.tsx`, one consistent **1.75 stroke**.

No Unicode glyph or emoji ever stands in for an icon — not `⇅`, not `+`/`–`,
not `·`. Those shipped once and were replaced by `SwapMark`, `Disclosure` and
`BulletMark`. A glyph doesn't share the system's stroke weight, doesn't align
optically with the drawn set, and moves when the font does.

A signed number (`−12`, `+3`, `±0`) is data, not an icon, and stays as text.

## Controls and states

Everything interactive clears **44pt** (`HIT`).

Shared primitives live in `src/components/primitives.tsx` — `Button`, `Panel`,
`Chip`, `StatPair`, `SectionLabel`, `ErrorText`, `AsyncBlock`. Anything
repeated across screens belongs there. Before it existed, 12 primary buttons
and 6 error lines were hand-assembled across 11 files, each re-deciding its own
sizes; that is what made the UI read as assembled rather than built.

Two rules that were violated and are now enforced by the primitives:

- **Disabled and pressed must not look alike.** Disabled drops to
  `panelRaised` with `ink3`. Pressed keeps its colour and dips opacity. Several
  screens expressed both as `opacity: 0.7` on saturated green.
- **An empty state is a claim about the data, so it waits for the data.**
  `AsyncBlock` orders loading → error → empty. Screens that read only `data`
  told an offline user their stack was empty.

Every mutation surfaces its failure. Destructive actions confirm first.

## Verifying

- `npx tsc --noEmit` in `app/`.
- Walk every screen and modal at phone width, in each state.
- Body and placeholder text ≥4.5:1, large text ≥3:1.
- The impeccable detector (`scripts/detect.mjs`) returns no findings on this
  codebase, but that is **not** evidence of quality: its rules are CSS/HTML
  shaped and it cannot see React Native inline style objects. Verified by
  fixture. Use `reference/audit.native.md` instead.
