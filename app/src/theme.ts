/*
DIRECTION CONTRACT — seed 02d0b60b (impeccable, direction scope, operate mode)

THESIS: A recovery instrument for an active peptide protocol — the readout you
check like a wearable, not a form you fill like a clinic. Refuses the light
health-app card grid.

OWN-WORLD: Near-black graphite ground; panels split by 1px hairline seams and
one step of elevation, never shadow stacks. One signal green carries adherence
and primary action; a luminous trace blue belongs to data lines only. Big
light-weight semi-condensed numerals; small tracked uppercase labels; drawn
1.75px stroke icons. State is always a drawn mark plus color, never hue alone.

STORY: The user opens to tonight's readout, sees at a glance what's due and
what's logged, acts in under twenty seconds, and trusts the instrument.

FIRST VIEWPORT: Adherence ring dominant top-center with light numerals inside;
day stamp above; due-dose rows below as panel rows with drawn state marks;
primary action is the row itself.

FORM: The Recovery Dashboard — wearable-recovery screen language. Rank 1 of 7
on the grounded list, chosen by the user over the assigned rank-3 direction.

FINISH: unreviewed and undocumented is unfinished; this build ends with the
finish review, the verdict, DESIGN.md, and every shipping raster carrying its
provenance.
*/

export const colors = {
  // Ground & surfaces (one-step elevation, hairline seams)
  bg: "#0E1114",
  panel: "#151A1F",
  panelRaised: "#1B2129",
  hairline: "#262D35",
  hairline2: "#39424D",

  // Ink. ink3 is the dimmest step that still clears 4.5:1 on both the page
  // ground and the panel — anything quieter belongs to hairline, not to text.
  ink: "#EAEEF2",
  ink2: "#A9B4BF",
  ink3: "#8A96A3",

  // Signal — adherence, success, primary action
  signal: "#35E39B",
  signalDim: "#1D5C43",
  signalFaint: "#12281F",
  onSignal: "#04140C",

  // Trace — data lines and charts only
  trace: "#52C4FF",
  traceFaint: "#12232E",

  // Semantic
  amber: "#F5B84A",
  amberFaint: "#2A2113",
  red: "#F27070",
  redFaint: "#2B1717",
} as const;

export const font = {
  // Barlow: UI voice. BarlowSemiCondensed: instrument numerals.
  regular: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
  bold: "Barlow_700Bold",
  numeral: "BarlowSemiCondensed_300Light",
  numeralMedium: "BarlowSemiCondensed_500Medium",
} as const;

/*
TYPE RAMP — 11 / 13 / 15 / 17 / 20 / 24 / 32 / 38 / 52.

Nine steps with real jumps between them, because this is an Operate surface:
scanability and a stable role scale beat expressive range. Every role below
resolves to one of those nine sizes — no half-points, no per-screen nudging.
Roles are named for the job they do, so a screen asks for `type.statLg` rather
than re-deciding what 38px means.

Light text on a near-black ground needs a touch more line height and tracking
than the same face would on white; that compensation lives here, once.
*/
export const type = {
  // Instrument readouts. The numerals ARE the product on this surface —
  // density is the point, not a pattern to be designed away.
  display: { fontFamily: font.numeral, fontSize: 52, color: colors.ink, letterSpacing: -0.5 },
  statLg: { fontFamily: font.numeral, fontSize: 38, color: colors.ink, letterSpacing: -0.5 },
  statMd: { fontFamily: font.numeral, fontSize: 32, color: colors.ink, letterSpacing: -0.5 },
  statSm: { fontFamily: font.numeralMedium, fontSize: 20, color: colors.ink, letterSpacing: 0.3 },

  // Voice
  title: { fontFamily: font.bold, fontSize: 24, color: colors.ink, letterSpacing: 0.2 },
  heading: { fontFamily: font.semibold, fontSize: 17, color: colors.ink, letterSpacing: 0.2 },
  headingSm: { fontFamily: font.semibold, fontSize: 15, color: colors.ink, letterSpacing: 0.2 },

  // Reading
  body: { fontFamily: font.regular, fontSize: 15, color: colors.ink2, lineHeight: 22 },
  bodySm: { fontFamily: font.regular, fontSize: 13, color: colors.ink2, lineHeight: 19 },

  // Supporting
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.ink3,
    textTransform: "uppercase" as const,
    letterSpacing: 1.4,
  },
  meta: { fontFamily: font.medium, fontSize: 13, color: colors.ink3, letterSpacing: 0.2 },
  metaSm: { fontFamily: font.medium, fontSize: 11, color: colors.ink3, letterSpacing: 0.2 },

  // Controls
  button: { fontFamily: font.bold, fontSize: 15, letterSpacing: 0.3, color: colors.ink },
  buttonSm: { fontFamily: font.bold, fontSize: 13, letterSpacing: 0.3, color: colors.ink },

  // One error voice, so a failure reads the same everywhere it can happen.
  error: { fontFamily: font.medium, fontSize: 13, color: colors.red, lineHeight: 19 },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

/*
SPACING — a 4pt grid, used through `space` rather than typed per call site.

The steps are deliberately uneven at the top (24 → 32 → 40) so separation
between groups can outrun separation within one. Tight groups, generous
separation, more room above a heading than below it.
*/
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  section: 32,
  screen: 40,
} as const;

/** Kept for arbitrary multiples of the same 4pt grid. */
export const spacing = (n: number) => n * 4;

/** Minimum tappable edge. Anything interactive clears this. */
export const HIT = 44;

export const panel = {
  backgroundColor: colors.panel,
  borderWidth: 1,
  borderColor: colors.hairline,
  borderRadius: radii.xl,
} as const;
