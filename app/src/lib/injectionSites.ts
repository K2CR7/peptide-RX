// Ported from legacy/peptide_rx.jsx (ROUTE_SITES, INJECT_STEPS, getRouteKey,
// getNextSite). Body-diagram (x,y) coordinates from the old SVG are dropped —
// the RN injection picker uses a list instead; everything else is unchanged.

export type BodyView = "front" | "back";

export interface InjectionSite {
  id: string;
  label: string;
  short: string;
  desc: string;
  /** Which body view the marker is pinned on. */
  view: BodyView;
  /**
   * Marker position in the body diagram's 200x360 viewBox. Left/right in a
   * site's name is always the USER's own side, so the mapping to screen x
   * flips between views: facing the front view, the user's left is on the
   * viewer's right; on the back view it is on the viewer's left.
   */
  x: number;
  y: number;
}

export type RouteKey = "SubQ" | "IM" | "SubQ or IM" | "Nasal spray" | "Oral";

const ABDOMEN: InjectionSite[] = [
  { id: "abd-ul", label: "Upper Left Abdomen", short: "Abd UL", desc: "2 inches left of navel, upper zone", view: "front", x: 116, y: 148 },
  { id: "abd-ur", label: "Upper Right Abdomen", short: "Abd UR", desc: "2 inches right of navel, upper zone", view: "front", x: 84, y: 148 },
  { id: "abd-ll", label: "Lower Left Abdomen", short: "Abd LL", desc: "2 inches left of navel, lower zone", view: "front", x: 116, y: 174 },
  { id: "abd-lr", label: "Lower Right Abdomen", short: "Abd LR", desc: "2 inches right of navel, lower zone", view: "front", x: 84, y: 174 },
];

const THIGHS: InjectionSite[] = [
  { id: "thigh-l", label: "Left Outer Thigh", short: "Thigh L", desc: "Outer middle of left thigh", view: "front", x: 120, y: 252 },
  { id: "thigh-r", label: "Right Outer Thigh", short: "Thigh R", desc: "Outer middle of right thigh", view: "front", x: 80, y: 252 },
];

const DELTOIDS = (desc: string): InjectionSite[] => [
  { id: "delt-l", label: "Left Deltoid", short: "Delt L", desc, view: "front", x: 145, y: 84 },
  { id: "delt-r", label: "Right Deltoid", short: "Delt R", desc, view: "front", x: 55, y: 84 },
];

export const ROUTE_SITES: Record<RouteKey, InjectionSite[]> = {
  SubQ: [
    ...ABDOMEN,
    { id: "flank-l", label: "Left Flank", short: "Flank L", desc: "Left love handle / lateral hip", view: "front", x: 126, y: 186 },
    { id: "flank-r", label: "Right Flank", short: "Flank R", desc: "Right love handle / lateral hip", view: "front", x: 74, y: 186 },
    ...THIGHS,
  ],
  IM: [
    ...DELTOIDS("Outer upper arm, 3 fingers below shoulder"),
    { id: "glute-l", label: "Left Glute", short: "Glute L", desc: "Upper outer quadrant of left buttock", view: "back", x: 82, y: 216 },
    { id: "glute-r", label: "Right Glute", short: "Glute R", desc: "Upper outer quadrant of right buttock", view: "back", x: 118, y: 216 },
    { id: "lat-l", label: "Left Lateral Thigh", short: "Lat L", desc: "Outer middle of left thigh, relaxed", view: "front", x: 124, y: 264 },
    { id: "lat-r", label: "Right Lateral Thigh", short: "Lat R", desc: "Outer middle of right thigh, relaxed", view: "front", x: 76, y: 264 },
  ],
  "SubQ or IM": [
    ...ABDOMEN,
    ...THIGHS,
    ...DELTOIDS("Outer upper arm — if going IM"),
  ],
  "Nasal spray": [],
  Oral: [],
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
  { mark: "timer", title: "Inject slowly", body: "Push the plunger steadily over 5–10 seconds. Do not rush — slow delivery reduces discomfort." },
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

/** Recommends the least-recently-used site to encourage rotation and avoid lipohypertrophy. */
export function getNextSite(routeKey: RouteKey, history: string[] = []): InjectionSite | null {
  const sites = ROUTE_SITES[routeKey];
  if (!sites || !sites.length) return null;
  const recent = history.slice(-sites.length);
  const unused = sites.find((s) => !recent.includes(s.id));
  return unused ?? sites[0];
}
