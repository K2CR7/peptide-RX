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

/*
Blue leads, green supports.

The previous palette was near-black with a saturated mint accent. That pairing
reads as console-game or fitness-tracker rather than clinical, and the green
was doing four unrelated jobs at once — primary action, adherence, logged
state and the streak — so it carried no particular meaning anywhere.

Now: a near-white ground, a deep sea-blue that leads every action and
measurement, and a single muted green reserved for "this is done". The
neutrals carry a blue bias rather than being pure grey, so they read as
chosen rather than defaulted.

Every text colour below was checked against the surface it sits on. The
tertiary ink is #5A7183 rather than something quieter because the obvious
choice (#6B8296) measures 3.99:1 on white — under the 4.5:1 floor for body
text, and this app puts real information in that step.
*/
export const colors = {
  // Ground & surfaces. The page is a hair off white so that true-white
  // panels still read as raised without needing a shadow.
  bg: "#FBFCFD",
  panel: "#FFFFFF",
  panelRaised: "#F2F6F8",
  hairline: "#E1E8ED",
  hairline2: "#C7D3DC",

  // Ink, all blue-biased. Contrast on #FFFFFF: ink 16.9:1, ink2 7.6:1,
  // ink3 5.1:1 — every step clears 4.5:1 for body text.
  ink: "#0B1F33",
  ink2: "#3C566E",
  ink3: "#5A7183",

  // Signal — the lead. Primary action, adherence, anything measured.
  // 7.0:1 on white as text, and white on it is the same 7.0:1 as a fill.
  signal: "#15607F",
  signalDim: "#A6C6D6",
  signalFaint: "#E8F1F6",
  onSignal: "#FFFFFF",

  // Trace — the support. One job: this dose is logged, this day was kept.
  // 5.2:1 on white, so it is safe as small text and not only as a fill.
  trace: "#1F7A6C",
  traceFaint: "#E6F2EF",

  // Semantic. Both darkened from the dark-theme versions, which were tuned
  // to glow on black and would have been illegible here.
  amber: "#9A6207",
  amberFaint: "#FBF2E3",
  red: "#B3261E",
  redFaint: "#FBEAE9",
} as const;

/*
Cormorant Garamond throughout.

Two things to know, because they are properties of the face rather than of
this code, and they will show up on screen:

  - It is a DISPLAY face, and an unusually delicate one. Cormorant was drawn
    for large sizes; its own designer describes it as intended for display
    use. The 11px tracked labels and 13px metadata sit far below that.
  - It is very high-contrast. The hairlines are extremely fine, and light
    text on a near-black ground thins them further, so they can drop out
    altogether at small sizes. This is the hardest test any face on the
    shortlist faces.

It does have a 300 Light, so the big ring numeral keeps a thin weight — but
there is no condensed cut, so doses set wider than the Barlow Semi-Condensed
they replace.

Reverting is one commit; the previous tokens were Barlow_400/500/600/700
with BarlowSemiCondensed_300Light / _500Medium for the numerals.
*/
export const font = {
  regular: "CormorantGaramond_400Regular",
  medium: "CormorantGaramond_500Medium",
  semibold: "CormorantGaramond_600SemiBold",
  bold: "CormorantGaramond_700Bold",
  numeral: "CormorantGaramond_300Light",
  numeralMedium: "CormorantGaramond_500Medium",
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
