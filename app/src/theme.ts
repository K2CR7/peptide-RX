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

  // Ink
  ink: "#EAEEF2",
  ink2: "#A9B4BF",
  ink3: "#6E7A86",

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

export const type = {
  display: { fontFamily: font.numeral, fontSize: 56, color: colors.ink, letterSpacing: -0.5 },
  displaySm: { fontFamily: font.numeral, fontSize: 40, color: colors.ink, letterSpacing: -0.5 },
  title: { fontFamily: font.bold, fontSize: 24, color: colors.ink, letterSpacing: 0.2 },
  heading: { fontFamily: font.semibold, fontSize: 17, color: colors.ink, letterSpacing: 0.2 },
  body: { fontFamily: font.regular, fontSize: 14.5, color: colors.ink2, lineHeight: 21 },
  label: {
    fontFamily: font.semibold,
    fontSize: 11,
    color: colors.ink3,
    textTransform: "uppercase" as const,
    letterSpacing: 1.4,
  },
  meta: { fontFamily: font.medium, fontSize: 12.5, color: colors.ink3, letterSpacing: 0.2 },
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
} as const;

export const spacing = (n: number) => n * 4;

export const panel = {
  backgroundColor: colors.panel,
  borderWidth: 1,
  borderColor: colors.hairline,
  borderRadius: radii.xl,
} as const;
