/*
DIRECTION CONTRACT — neo-brutalist clinical instrument

THESIS: A medical tool, not a wellness app. Reads like a lab requisition
form or an instrument faceplate: hard rules, no softness, nothing floating.
Refuses the rounded-card dashboard every health app ships.

OWN-WORLD: 0px radius everywhere. 2px solid borders — black on paper in
light mode, white on black in dark. No drop shadows, no gradients, no
pills, no floating cards: panels are regions ruled onto the page, flush to
the grid, stacked sequentially rather than centered. One saturated signal
green for state; amber and red are reserved for missed and destructive.
Barlow Semi-Condensed numerals carry every figure.

STORY: The user reads their protocol the way they'd read a chart — scan,
act, done.

FIRST VIEWPORT: Ruled header, then a segmented dose meter (blocks, not a
ring), then due doses as grid rows with hard state marks.

FORM: Neo-brutalism under a medical-instrument brief, per the standing
project constraint.

FINISH: unreviewed and undocumented is unfinished.
*/

export type ThemeMode = "light" | "dark";

interface Palette {
  bg: string;
  panel: string;
  panelRaised: string;
  hairline: string;
  hairline2: string;
  ink: string;
  ink2: string;
  ink3: string;
  signal: string;
  signalDim: string;
  signalFaint: string;
  onSignal: string;
  trace: string;
  traceFaint: string;
  amber: string;
  amberFaint: string;
  red: string;
  redFaint: string;
}

// Paper and ink. Borders are literally black, per the project constraint.
const LIGHT: Palette = {
  bg: "#FFFFFF",
  panel: "#FFFFFF",
  panelRaised: "#EDEDEA",
  hairline: "#000000",
  hairline2: "#000000",
  ink: "#000000",
  ink2: "#2B2B2B",
  ink3: "#595959",
  signal: "#00913A",
  signalDim: "#000000",
  signalFaint: "#CFF3DD",
  onSignal: "#FFFFFF",
  trace: "#0B46D9",
  traceFaint: "#D8E2FF",
  amber: "#9A5B00",
  amberFaint: "#FFEBC7",
  red: "#C21B12",
  redFaint: "#FFDCD9",
};

// Black ground. Borders invert to white — black-on-black is not a border.
const DARK: Palette = {
  bg: "#000000",
  panel: "#000000",
  panelRaised: "#141414",
  hairline: "#FFFFFF",
  hairline2: "#FFFFFF",
  ink: "#FFFFFF",
  ink2: "#D6D6D6",
  ink3: "#9E9E9E",
  signal: "#00E35C",
  signalDim: "#FFFFFF",
  signalFaint: "#06301A",
  onSignal: "#000000",
  trace: "#5AA2FF",
  traceFaint: "#081A2E",
  amber: "#FFB020",
  amberFaint: "#2B1D00",
  red: "#FF6056",
  redFaint: "#330C09",
};

export const font = {
  regular: "Barlow_400Regular",
  medium: "Barlow_500Medium",
  semibold: "Barlow_600SemiBold",
  bold: "Barlow_700Bold",
  numeral: "BarlowSemiCondensed_300Light",
  numeralMedium: "BarlowSemiCondensed_500Medium",
} as const;

/** Nothing is rounded. Kept as a token so call sites stay readable. */
export const radii = { sm: 0, md: 0, lg: 0, xl: 0 } as const;

/** Every rule on screen is this thick. */
export const BORDER = 2;

export const spacing = (n: number) => n * 4;

function makeType(c: Palette) {
  return {
    display: { fontFamily: font.numeral, fontSize: 56, color: c.ink, letterSpacing: -0.5 },
    displaySm: { fontFamily: font.numeral, fontSize: 40, color: c.ink, letterSpacing: -0.5 },
    title: {
      fontFamily: font.bold,
      fontSize: 22,
      color: c.ink,
      letterSpacing: 0.6,
      textTransform: "uppercase" as const,
    },
    heading: { fontFamily: font.semibold, fontSize: 16, color: c.ink, letterSpacing: 0.2 },
    body: { fontFamily: font.regular, fontSize: 14.5, color: c.ink2, lineHeight: 21 },
    label: {
      fontFamily: font.bold,
      fontSize: 11,
      color: c.ink2,
      textTransform: "uppercase" as const,
      letterSpacing: 1.2,
    },
    meta: { fontFamily: font.medium, fontSize: 13, color: c.ink3, letterSpacing: 0.2 },
  };
}

function makePanel(c: Palette) {
  return {
    backgroundColor: c.bg,
    borderWidth: BORDER,
    borderColor: c.hairline,
    borderRadius: 0,
  } as const;
}

/*
 * Theme is global and changes about once a year, so it lives in module
 * bindings rather than threading a context through 360 call sites. App.tsx
 * calls setThemeMode from an event handler (never during render) and remounts
 * the tree with a key, which guarantees every component re-reads the new
 * palette. The one rule: never capture these in a module-level constant —
 * read them inside a component, or the value freezes at import time.
 */
export let colors: Palette = DARK;
export let type = makeType(DARK);
export let panel = makePanel(DARK);
export let mode: ThemeMode = "dark";

export function setThemeMode(next: ThemeMode): void {
  mode = next;
  colors = next === "light" ? LIGHT : DARK;
  type = makeType(colors);
  panel = makePanel(colors);
}
