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
  /*
    Ground & surfaces, carrying the brand teal rather than sitting next to it.

    The page was #FBFCFD against #FFFFFF panels — about a 1% difference, so
    the app read as one undifferentiated sheet of white and the teal had
    nowhere to live except a few buttons. The page is now a pale teal wash,
    which does two jobs at once: the colour is present on every screen
    without being applied to anything, and white panels genuinely lift off
    it (1.15:1 — slight, but enough to separate without a shadow).

    Hairlines and wells are tinted from the same hue, so nothing in the
    neutral range is a plain grey.
  */
  bg: "#E6F2F1",
  panel: "#FFFFFF",
  panelRaised: "#F0F8F7",
  hairline: "#CFE4E2",
  hairline2: "#A5CCC9",
  /** The unfilled part of the adherence ring. 1.51:1 on a white panel —
      faint, but enough that the gauge reads as a gauge at 0%. */
  track: "#BCD8D5",

  /*
    Ink, biased teal to match. Every step was checked against the PAGE, not
    just the panel, because the page is the darker of the two and a value
    that passes on white can still fail there.

    ink 13.1:1 · ink2 6.1:1 · ink3 4.7:1 on the page. ink3 is #4D7174 rather
    than anything lighter because the obvious choices (#5C8386, #52777A)
    measure 3.6-4.3:1 on this ground — under the floor, and real information
    lives in that step.
  */
  ink: "#0C2B2E",
  ink2: "#3A5F62",
  ink3: "#4D7174",

  /*
    Signal — the lead, and the brand colour.

    #56B0AD is the chosen teal and it is a FILL, not a drawing colour: it
    measures 2.56:1 on white, under the 4.5:1 floor for text and under even
    the 3:1 floor for icons and hairlines. Navy on it is 6.53:1, so it holds
    dark text comfortably — a light-teal button with navy type rather than
    the usual saturated button with white type.

    Anything that has to be legible against white — label text, an icon
    stroke, a 2px rule — uses signalInk instead: the same hue darkened to
    5.50:1. One colour family, two jobs, neither one guessed.
  */
  signal: "#56B0AD",
  signalInk: "#257471",
  signalDim: "#A9D8D6",
  signalFaint: "#DCF0EE",
  onSignal: "#0C2B2E",

  // Trace — the support. One job: this dose is logged, this day was kept.
  // 5.3:1 on the page, so it is safe as small text and not only as a fill.
  trace: "#1C6E61",
  traceFaint: "#DCEFEA",

  // Semantic. Both checked against the tinted page rather than white:
  // amber 5.3:1, red 6.3:1.
  amber: "#8A5806",
  amberFaint: "#F7EEDC",
  red: "#A8231C",
  redFaint: "#F8E6E4",
} as const;

/*
IBM Plex Sans, with IBM Plex Sans Condensed for the instrument numerals.

Drawn for IBM's own technical documentation, which is the reason to pick it
here: it carries engineering credibility from what it was made for rather
than from resembling something clinical. Low stroke contrast, so it holds its
weight at the 11px tracked labels and 13px metadata this app is mostly made
of — the specific thing Cormorant could not do. Slightly warmer than a pure
grotesque, with real character in the a and g, so it reads precise without
reading cold.

The condensed cut matters more than it looks. Doses share a row with a
peptide name on a 430px screen, and "1,250 mcg" set at full width pushes that
row. Condensed numerals keep the column tight and the figures tabular.

Previously Cormorant Garamond — a high-contrast display serif whose
hairlines disappeared at small sizes and which had no condensed cut at all.
Before that, Barlow_400/500/600/700 with BarlowSemiCondensed_300Light/_500Medium.
*/
export const font = {
  regular: "IBMPlexSans_400Regular",
  medium: "IBMPlexSans_500Medium",
  semibold: "IBMPlexSans_600SemiBold",
  bold: "IBMPlexSans_700Bold",
  numeral: "IBMPlexSansCondensed_300Light",
  numeralMedium: "IBMPlexSansCondensed_500Medium",
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

/*
Tight corners.

These were 8/12/16/20, which put 44 elements at a 12px radius and left the
buttons reading as pills. Rounded corners everywhere is what makes an
interface feel like a friendly app rather than an instrument — it was doing
more of that work than either the palette or the typeface.

Clinical software sits around 4-6px: enough to avoid a hard CAD edge,
not enough to read as soft.
*/
export const radii = {
  sm: 4,
  md: 6,
  lg: 8,
  xl: 10,
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
