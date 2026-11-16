// Ported from legacy/peptide_rx.jsx (ROUTE_SITES, INJECT_STEPS, getRouteKey,
// getNextSite). Body-diagram (x,y) coordinates from the old SVG are dropped —
// the RN injection picker uses a list instead; everything else is unchanged.

export type BodyView = "front" | "back";

export interface InjectionSite {
  id: string;
  label: string;
  short: string;
  desc: string;
  /**
   * Whether this site takes part in rotation.
   *
   * Rotation is a property of tissue that gets punctured. An oral dose goes
   * in your mouth and a nasal spray goes in your nose, every single time;
   * there is no second mouth to give the first one a rest. Marking them
   * `fixed` is what lets the body diagram draw a complete protocol — nothing
   * off-chart, which is the first objection anyone raises at a body-led
   * tracker — without the rotation machinery making claims about them. A
   * fixed site never gets recommended, never counts as "recovering", and
   * several doses into one on one day is normal rather than the thing
   * rotation exists to prevent.
   */
  kind: "rotating" | "fixed";
  /** Which body view the marker is pinned on. */
  view: BodyView;
  /**
   * Marker position in the body diagram's 200x360 viewBox. Left/right in a
   * site's name is always the USER's own side, so the mapping to screen x
   * flips between views: facing the front view, the user's left is on the
   * viewer's right; on the back view it is on the viewer's left.
   *
   * Every number here was measured off the figure in BodyFigure.tsx against
   * a 10-unit grid. They are not transferable: the previous set came from a
   * figure with different proportions and landed the deltoids on the chest
   * and the thigh sites on the knees. If the figure is ever redrawn, these
   * have to be read off it again rather than scaled.
   *
   * Landmarks on the current figure: navel (100, 140), crotch y 194, knee
   * y 245, acromion y 68, gluteal fold y 186.
   */
  x: number;
  y: number;
}

export type RouteKey = "SubQ" | "IM" | "SubQ or IM" | "Nasal spray" | "Oral";

/*
  Spares every rotating site from repeating `kind: "rotating"` fourteen
  times. Fixed sites are written out in full below, because there are two of
  them and the whole point of the field is that they are the exception.
*/
const rotating = (sites: Omit<InjectionSite, "kind">[]): InjectionSite[] =>
  sites.map((s) => ({ ...s, kind: "rotating" }));

const ABDOMEN: InjectionSite[] = rotating([
  { id: "abd-ul", label: "Upper Left Abdomen", short: "Abd UL", desc: "2 inches left of navel, upper zone", view: "front", x: 112, y: 130 },
  { id: "abd-ur", label: "Upper Right Abdomen", short: "Abd UR", desc: "2 inches right of navel, upper zone", view: "front", x: 88, y: 130 },
  { id: "abd-ll", label: "Lower Left Abdomen", short: "Abd LL", desc: "2 inches left of navel, lower zone", view: "front", x: 112, y: 155 },
  { id: "abd-lr", label: "Lower Right Abdomen", short: "Abd LR", desc: "2 inches right of navel, lower zone", view: "front", x: 88, y: 155 },
]);

const THIGHS: InjectionSite[] = rotating([
  { id: "thigh-l", label: "Left Outer Thigh", short: "Thigh L", desc: "Outer middle of left thigh", view: "front", x: 120, y: 218 },
  { id: "thigh-r", label: "Right Outer Thigh", short: "Thigh R", desc: "Outer middle of right thigh", view: "front", x: 80, y: 218 },
]);

const FLANKS: InjectionSite[] = rotating([
  { id: "flank-l", label: "Left Flank", short: "Flank L", desc: "Left love handle / lateral hip", view: "front", x: 124, y: 168 },
  { id: "flank-r", label: "Right Flank", short: "Flank R", desc: "Right love handle / lateral hip", view: "front", x: 76, y: 168 },
]);

const GLUTES_AND_LATS: InjectionSite[] = rotating([
  { id: "glute-l", label: "Left Glute", short: "Glute L", desc: "Upper outer quadrant of left buttock", view: "back", x: 77, y: 157 },
  { id: "glute-r", label: "Right Glute", short: "Glute R", desc: "Upper outer quadrant of right buttock", view: "back", x: 123, y: 157 },
  { id: "lat-l", label: "Left Lateral Thigh", short: "Lat L", desc: "Outer middle of left thigh, relaxed", view: "front", x: 123, y: 222 },
  { id: "lat-r", label: "Right Lateral Thigh", short: "Lat R", desc: "Outer middle of right thigh, relaxed", view: "front", x: 77, y: 222 },
]);

const DELTOIDS = (desc: string): InjectionSite[] =>
  rotating([
    { id: "delt-l", label: "Left Deltoid", short: "Delt L", desc, view: "front", x: 134, y: 84 },
    { id: "delt-r", label: "Right Deltoid", short: "Delt R", desc, view: "front", x: 66, y: 84 },
  ]);

/*
  The two routes that do not pin.

  These were empty arrays, which meant an oral or nasal peptide had no place
  on the body at all: it logged with a null site, drew nothing, and the
  figure quietly stopped being a picture of the protocol. 3 of 18 reference
  peptides are one of these, so the hole was real.

  Coordinates read off the head in BodyFigure.tsx, whose front outline runs
  from y 11 to y 177 on the 752-unit artboard, centred on x 376. Scaled by
  FIGURE_SCALE (200/752) that is a head between y 3 and y 47 in this
  diagram's own space, centred on x 100. The nose sits a little under
  two-thirds down the face and the mouth a little under four-fifths, which
  is where these two land.

  The head is currently a featureless oval, so neither mark has a feature to
  sit on and both are read by position alone. That is a known weakness and
  the reason the Stage 3 figure brief asks for a visible nose and mouth.
*/
const NOSE: InjectionSite = {
  id: "nasal",
  label: "Nasal",
  short: "Nasal",
  desc: "Alternate nostrils each session",
  kind: "fixed",
  view: "front",
  x: 100,
  y: 31,
};

const MOUTH: InjectionSite = {
  id: "oral",
  label: "Oral",
  short: "Oral",
  desc: "Swallowed — nothing to rotate",
  kind: "fixed",
  view: "front",
  x: 100,
  y: 39,
};

export const ROUTE_SITES: Record<RouteKey, InjectionSite[]> = {
  SubQ: [...ABDOMEN, ...FLANKS, ...THIGHS],
  IM: [...DELTOIDS("Outer upper arm, 3 fingers below shoulder"), ...GLUTES_AND_LATS],
  "SubQ or IM": [
    ...ABDOMEN,
    ...THIGHS,
    ...DELTOIDS("Outer upper arm, if going IM"),
  ],
  "Nasal spray": [NOSE],
  Oral: [MOUTH],
};

/** Human label for a site id, across every route's site list. */
export function siteLabel(id: string): string {
  for (const sites of Object.values(ROUTE_SITES)) {
    const hit = sites.find((s) => s.id === id);
    if (hit) return hit.label;
  }
  return id;
}

/** Named mark for the drawn step icon this instruction should show. */
export type StepMark =
  | "wash" | "swab" | "needle" | "timer" | "press" | "dispose"
  | "muscle" | "aspirate" | "nose" | "pill" | "note";

export interface InjectStep {
  mark: StepMark;
  title: string;
  body: string;
}

const SUBQ_STEPS: InjectStep[] = [
  { mark: "wash", title: "Wash hands", body: "Wash thoroughly with soap and water for 20 seconds. Dry completely." },
  { mark: "swab", title: "Prep the site", body: "Swab the injection site with an alcohol wipe. Wait 30 seconds for it to fully dry." },
  { mark: "needle", title: "Pinch & angle", body: "Pinch 1–2 inches of skin firmly. Insert the needle at a 45° angle (90° if you have more body fat at the site)." },
  { mark: "timer", title: "Inject slowly", body: "Push the plunger steadily over 5–10 seconds. Slow delivery reduces discomfort." },
  { mark: "press", title: "Remove & press", body: "Pull the needle out at the same angle it entered. Apply gentle pressure with a cotton ball. Do not rub." },
  { mark: "dispose", title: "Dispose safely", body: "Cap the needle immediately and place in a sharps container. Never reuse needles." },
];

export const INJECT_STEPS: Record<RouteKey, InjectStep[]> = {
  "SubQ or IM": SUBQ_STEPS,
  SubQ: SUBQ_STEPS,
  IM: [
    { mark: "wash", title: "Wash hands", body: "Wash thoroughly with soap and water for 20 seconds. Dry completely." },
    { mark: "swab", title: "Prep the site", body: "Swab the muscle site with an alcohol wipe. Wait 30 seconds to fully dry." },
    { mark: "muscle", title: "Relax the muscle", body: "Completely relax the target muscle. Tensing it makes injection more painful and harder." },
    { mark: "needle", title: "Insert at 90°", body: "Insert the needle in one smooth, confident motion at 90°. Hesitation causes more discomfort." },
    { mark: "aspirate", title: "Aspirate", body: "Pull the plunger back slightly. If no blood appears, proceed. If you see blood, withdraw and choose a new site." },
    { mark: "timer", title: "Inject slowly", body: "Depress the plunger slowly over 10 seconds. Slow delivery into muscle reduces soreness." },
    { mark: "press", title: "Remove & press", body: "Withdraw smoothly. Apply firm pressure for 30 seconds. Gently massage to disperse the solution." },
    { mark: "dispose", title: "Dispose safely", body: "Cap the needle and dispose in a sharps container immediately." },
  ],
  "Nasal spray": [
    { mark: "nose", title: "Clear passages", body: "Blow your nose gently to clear any congestion. Breathe normally." },
    { mark: "needle", title: "Prime if new", body: "If first use, pump the spray 3–4 times into the air until an even mist appears." },
    { mark: "nose", title: "Position", body: "Tilt your head slightly forward. Insert the tip gently into one nostril, aiming slightly outward (away from the septum)." },
    { mark: "timer", title: "Spray & breathe", body: "Press the pump firmly once while breathing in slowly through your nose. Breathe out through your mouth." },
    { mark: "press", title: "Other nostril", body: "Repeat for the second nostril if your dose calls for it. Alternate nostrils each session." },
    { mark: "note", title: "Don't blow", body: "Avoid blowing your nose or sneezing for at least 15 minutes to allow absorption." },
  ],
  Oral: [
    { mark: "timer", title: "Timing matters", body: "Take at the same time each day to keep your cycle tracker accurate." },
    { mark: "pill", title: "Dose", body: "Swallow the capsule or measure the liquid dose with the provided syringe. No injection required." },
    { mark: "pill", title: "With or without food", body: "Can be taken with or without food. Some users prefer a small snack to reduce nausea in early weeks." },
    { mark: "note", title: "Log it", body: "Mark as taken so your schedule stays accurate." },
  ],
};

export function getRouteKey(route: string | undefined | null): RouteKey {
  if (!route) return "SubQ";
  if (route.includes("Nasal")) return "Nasal spray";
  if (route.includes("Oral")) return "Oral";
  if (route.includes("IM") && !route.includes("SubQ")) return "IM";
  return route.includes("or IM") ? "SubQ or IM" : "SubQ";
}

/**
 * The single place a fixed route always goes, or null for a route that
 * rotates. Lets a caller ask "is there anything to choose here?" without
 * reaching into the site list and inferring it from a length of 1.
 */
export function fixedSiteFor(routeKey: RouteKey): InjectionSite | null {
  const sites = ROUTE_SITES[routeKey];
  return sites.length === 1 && sites[0].kind === "fixed" ? sites[0] : null;
}

/** Recommends the least-recently-used site to encourage rotation and avoid lipohypertrophy. */
export function getNextSite(routeKey: RouteKey, history: string[] = []): InjectionSite | null {
  const sites = ROUTE_SITES[routeKey];
  if (!sites || !sites.length) return null;
  // A fixed route has somewhere to draw but nothing to recommend. Returning
  // its one site here would dress "your nose" up as a rotation decision.
  if (sites.every((s) => s.kind === "fixed")) return null;
  const recent = history.slice(-sites.length);
  const unused = sites.find((s) => !recent.includes(s.id));
  return unused ?? sites[0];
}

/*
  The sites used lately, oldest first, across EVERY peptide.

  This was filtered to one stack item, which gave two injectable peptides two
  independent rotations: each one walked its own cycle, neither could see the
  other, and nothing stopped both of them being recommended the same site on
  the same day. That is the exact thing rotation exists to prevent, and it is
  worse than no recommendation, because the app was the thing asserting the
  spot was free. A site is a property of the body; tissue does not care which
  vial the dose came from.

  Filtered to the ids this route can actually use, which is not cosmetic:
  getNextSite reads a window the length of the site list and returns the
  first site missing from it. An id from another route's set can never match
  a site in this one, so leaving it in spends a slot in that window while
  excluding nothing, and pushes a real entry out the back of it. A glute from
  Monday's IM dose would quietly make Monday's abdominal site look free.
*/
export function rotationHistory(
  logs: { site: string | null; takenAt: string }[],
  routeKey: RouteKey,
): string[] {
  const usable = new Set(ROUTE_SITES[routeKey].map((s) => s.id));
  return [...logs]
    .sort((a, b) => new Date(a.takenAt).getTime() - new Date(b.takenAt).getTime())
    .map((log) => log.site)
    .filter((site): site is string => site !== null && usable.has(site));
}

/**
 * Days since each site was last used, across every peptide. Absent means
 * never used, which is not the same as used a long time ago and is drawn
 * differently.
 */
export function daysSinceBySite(
  logs: { site: string | null; takenAt: string }[],
  now: Date = new Date(),
): Map<string, number> {
  const today = new Date(now).setHours(0, 0, 0, 0);
  const out = new Map<string, number>();
  logs.forEach((log) => {
    if (!log.site) return;
    const days = Math.floor((today - new Date(log.takenAt).setHours(0, 0, 0, 0)) / 86400000);
    // Future-dated rows are not a thing the app writes, but a clock change
    // can produce one and a negative here would read as "used tomorrow".
    const clamped = Math.max(0, days);
    const seen = out.get(log.site);
    if (seen === undefined || clamped < seen) out.set(log.site, clamped);
  });
  return out;
}

/**
 * The site ids out of a run of logs, oldest first, skipping doses that had no
 * site to record. Rotation only has meaning for routes you actually pin, so an
 * oral or nasal dose must not shift the cycle along.
 */
export function siteHistory(logs: { site: string | null }[]): string[] {
  return logs.map((l) => l.site).filter((s): s is string => s !== null);
}
