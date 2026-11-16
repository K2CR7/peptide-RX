/*
The body, as the screen.

What this replaces: a progress ring, a checklist and a small read-only body
diagram stacked down a column. Everything on that page except the diagram is
something any habit tracker has, and the diagram — the one thing a notes app
cannot do — was the last thing on it. This inverts that. The body is the
interface: you log a dose by touching the place on yourself it went.

WHY THAT IS THE RIGHT CONTROL, and not just a bigger picture. The question
rotation asks is spatial — which part of me have I not used lately — and the
answer was previously delivered as a list of place names, which makes the
reader rebuild the body in their head before they can answer it. Drawing it
answers it by being looked at. Making it tappable means the act of recording
and the act of reading the record happen in the same place, so the record
stays accurate for the same reason it stays legible.

SELECT, THEN CONFIRM. One tap rings a site and opens a bar naming it; the
dose is written by a button in that bar. A single tap would be faster and
would also mean a slipped thumb silently writes a medical record claiming a
drug went into a part of the body it did not go into. There is no undo on
this screen, and the cost of the extra tap is paid once per dose.

THE MARKS, separated by shape as well as weight, per the measured limit in
theme.ts — amber and red are 2.2 ΔE apart under deuteranopia, so nothing in
this app may carry state in colour alone:

  halo + filled disc   injected today
  dashed open ring     where the rotation goes next
  solid dot, 3 weights how long since that site was last used
  hairline dot         never used

The weight ramp runs the way the fill does: heaviest is most recently used,
so a cluster of dark marks is a region being hammered and a spread of pale
ones is a rotation working. The recommendation is the only OPEN mark on the
figure, which is why it survives being the palest region on it.

FIXED SITES ARE DRAWN TOO. Oral and nasal peptides used to log a null site
and appear nowhere, which quietly made the figure a picture of only part of
the protocol — 3 of the 18 reference peptides. They now pin to the mouth and
the nose, marked `fixed` in injectionSites.ts so that none of the rotation
machinery makes claims about them: no recommendation, no recovery shading,
and a repeat dose draws a count rather than the repeat-use warning ring,
because three oral doses in a day is the schedule working, not a problem.

A fixed site is added to the figure whatever the main route is, which is
safe for exactly the reason the rotating sets are not merged: the mouth
takes part in no rotation, so putting it on a SubQ figure cannot corrupt
one. Two ROTATING routes in one stack genuinely are two cycles over two site
sets, and overlaying those would draw abdomen and glutes as though they were
one — so the figure still picks a single rotating route and says so.

THE LIST IS STILL THERE. Tap targets on a diagram are poor for screen
readers, and this is the only control for an action that matters, so the
dose list below this panel remains a complete parallel path and
`Choose from a list` opens the full picker unchanged.
*/
import { useEffect, useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import Svg, { Circle, G, Text as SvgLabel } from "react-native-svg";
import { BodyFigure } from "./BodyFigure";
import { CircularProgress } from "./CircularProgress";
import type { BodyView, InjectionSite, RouteKey } from "../lib/injectionSites";
import { ROUTE_SITES } from "../lib/injectionSites";
import { colors, font, radii, space, type } from "../theme";

/** The space every site coordinate in injectionSites.ts is measured in. */
const VB_W = 200;
const VB_H = 360;

/*
  The figure gets the width a phone can give it and no more. 240 puts the
  closest pair of sites — the upper and lower abdominal zones, 25 viewBox
  units apart — exactly 30px apart on screen, which is what sets the touch
  target below: any larger and neighbouring targets overlap, and a tap that
  lands on the wrong site is worse here than a tap that lands on nothing.
*/
const MAX_FIGURE = 240;
const TOUCH = 30;

/*
  Head marks get a smaller target, because the nose and the mouth sit 8
  viewBox units apart — about 10px at this width — and two 30px targets
  there would overlap so hard that the upper one became untappable.

  24px still overlaps. A target that did not would be 10px, which is not a
  target. The honest position is that the head is too small to pin reliably
  by touch on this figure, and the parallel paths — the dose rows below this
  panel, and `Choose from a list` — are the reliable way to log an oral or
  nasal dose. Stage 3's figure gives the head real landmarks, which is the
  point to revisit this.
*/
const TOUCH_FIXED = 24;

const VIEWS: BodyView[] = ["front", "back"];

export interface PendingDose {
  stackItemId: string;
  name: string;
  routeKey: RouteKey;
}

interface Props {
  /** Every site drawn on this figure: one rotating route, plus any fixed. */
  sites: InjectionSite[];
  /** How many times each site id was used today. */
  usedToday: Record<string, number>;
  /** Days since each site was last used. Absent means never. */
  daysSince: Map<string, number>;
  /** Where the rotation goes next, or null for a stack that only pins fixed. */
  next: InjectionSite | null;
  done: number;
  due: number;
  /** Outstanding doses, deduped by item, for the confirm bar. */
  pending: PendingDose[];
  onLog: (stackItemId: string, site: string) => void;
  onOpenList: () => void;
}

export function BodyToday({
  sites,
  usedToday,
  daysSince,
  next,
  done,
  due,
  pending,
  onLog,
  onOpenList,
}: Props) {
  /*
    Measured, not assumed. The sibling week grid learned this the expensive
    way: it sized itself from a hardcoded 390, which is one specific iPhone,
    and silently clipped days off everything narrower. On web this app
    renders inside a fixed-width phone frame, so useWindowDimensions is the
    browser window and has nothing to do with how much room this panel has.
  */
  const [boxW, setBoxW] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const shownViews = useMemo(
    () => VIEWS.filter((v) => sites.some((s) => s.view === v)),
    [sites],
  );

  /*
    Open on the side today is happening on, so a glute protocol does not
    present a blank abdomen and make the user find the toggle to see their
    own data. Preference order: where the rotation says to go next, then
    where something was logged today, then the front.
  */
  const autoView: BodyView = useMemo(() => {
    if (next) return next.view;
    const hit = sites.find((s) => (usedToday[s.id] ?? 0) > 0);
    if (hit) return hit.view;
    return shownViews[0] ?? "front";
  }, [next, sites, usedToday, shownViews]);

  const [view, setView] = useState<BodyView>(autoView);

  /*
    Logs arrive a tick after mount, so the first auto-pick is computed
    against an empty history and can land on the wrong side. Re-sync until
    the user works the toggle themselves — the same fix the picker carries.
  */
  useEffect(() => {
    if (!touched) setView(autoView);
  }, [autoView, touched]);

  const figureW = boxW > 0 ? Math.min(MAX_FIGURE, boxW) : 0;
  const figureH = (figureW / VB_W) * VB_H;
  const scale = figureW / VB_W;

  const selectedSite = sites.find((s) => s.id === selected) ?? null;

  /*
    Only the peptides that can actually go in the tapped spot. Tapping the
    mouth must not offer to log a subcutaneous peptide there, and tapping an
    abdominal site must not offer an oral one — the figure carries more than
    one route's sites, so this filter is what keeps that honest.
  */
  const offers = useMemo(() => {
    if (!selectedSite) return [];
    return pending.filter((p) =>
      ROUTE_SITES[p.routeKey].some((s) => s.id === selectedSite.id),
    );
  }, [pending, selectedSite]);

  const ratio = due > 0 ? done / due : 0;

  return (
    <View style={{ gap: space.md }} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      {/* Header: the label, and the day's count as a ratio beside the gauge.
          The ring is the small figure the component was designed to be —
          the reading is the pair of integers, which is legible without it. */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: space.md }}>
        <View style={{ flex: 1 }}>
          <Text style={type.label}>Injection sites</Text>
          <Text style={[type.heading, { marginTop: 2 }]}>
            {due === 0 ? "Nothing due today" : `${done} of ${due} logged`}
          </Text>
        </View>
        {due > 0 && <CircularProgress size={56} progress={ratio} />}
      </View>

      {shownViews.length > 1 && (
        <View style={{ flexDirection: "row", alignSelf: "center", gap: space.xs }}>
          {shownViews.map((v) => {
            const on = v === view;
            return (
              <Pressable
                key={v}
                onPress={() => {
                  setTouched(true);
                  setView(v);
                }}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={v === "front" ? "Front view" : "Back view"}
                style={({ pressed }) => ({
                  minHeight: 36,
                  paddingHorizontal: 18,
                  justifyContent: "center",
                  borderRadius: radii.md,
                  borderWidth: 1,
                  borderColor: on ? colors.signalDim : colors.hairline,
                  backgroundColor: on ? colors.signalFaint : "transparent",
                  opacity: pressed ? 0.7 : 1,
                })}
              >
                <Text
                  style={{
                    fontFamily: font.semibold,
                    fontSize: 13,
                    letterSpacing: 0.3,
                    color: on ? colors.signalInk : colors.ink3,
                  }}
                >
                  {v === "front" ? "Front" : "Back"}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Nothing is drawn until the box has been measured once. A figure at
          width 0 is not a cheap frame, it is a frame with the wrong answer
          in it. */}
      {figureW > 0 && (
        <View style={{ alignItems: "center", gap: space.xs }}>
          <View style={{ width: figureW, height: figureH }}>
            <Svg width={figureW} height={figureH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
              {/*
                A step lighter than the picker's figure draws it, which is
                not a style choice. The unused-site dots are hairline2, and
                on a hairline2 contour a dot sitting on the edge of a limb —
                which several of them do, because that is where you inject —
                disappears into the outline. The figure is the context and
                the marks are the data, so the figure gives way.
              */}
              <BodyFigure view={view} color={colors.hairline} />

              {sites
                .filter((s) => s.view === view)
                .map((site) => (
                  <SiteMark
                    key={site.id}
                    site={site}
                    used={usedToday[site.id] ?? 0}
                    days={daysSince.get(site.id)}
                    isNext={next?.id === site.id}
                    isSelected={selected === site.id}
                  />
                ))}
            </Svg>

            {/*
              Touch targets as views over the drawing rather than press
              handlers on the SVG nodes: they carry their own accessibility
              labels, they are the same size whatever the mark under them
              is drawn at, and they will keep working unchanged when the
              figure becomes raster art.
            */}
            {sites
              .filter((s) => s.view === view)
              .map((site) => (
                <Pressable
                  key={site.id}
                  onPress={() => setSelected((cur) => (cur === site.id ? null : site.id))}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selected === site.id }}
                  accessibilityLabel={`${site.label}. ${recency(site, usedToday[site.id] ?? 0, daysSince.get(site.id))}`}
                  style={{
                    position: "absolute",
                    left: site.x * scale - hit(site) / 2,
                    top: site.y * scale - hit(site) / 2,
                    width: hit(site),
                    height: hit(site),
                    borderRadius: hit(site) / 2,
                  }}
                />
              ))}
          </View>

          {/*
            Which way round the figure faces, because a marker on the user's
            left arm is drawn on the right of a front view and on the left of
            a back one. Without this the diagram is mirrored half the time
            and silently wrong. Shown even when there is no toggle, because
            the ambiguity does not come from having two views.
          */}
          <Text style={type.metaSm}>
            {view === "front" ? "Front · your left is on the right" : "Back · your left is on the left"}
          </Text>
        </View>
      )}

      {selectedSite && (
        <View
          style={{
            borderWidth: 1,
            borderColor: colors.signalDim,
            backgroundColor: colors.signalFaint,
            borderRadius: radii.lg,
            padding: space.md,
            gap: space.sm,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between" }}>
            <Text style={type.headingSm}>{selectedSite.label}</Text>
            <Text style={type.metaSm}>
              {recency(selectedSite, usedToday[selectedSite.id] ?? 0, daysSince.get(selectedSite.id))}
            </Text>
          </View>

          <Text style={type.meta}>{selectedSite.desc}</Text>

          {offers.length > 0 ? (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
              {offers.map((p) => (
                <Pressable
                  key={p.stackItemId}
                  onPress={() => {
                    onLog(p.stackItemId, selectedSite.id);
                    setSelected(null);
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Log ${p.name} at ${selectedSite.label}`}
                  style={({ pressed }) => ({
                    minHeight: 44,
                    justifyContent: "center",
                    paddingHorizontal: 16,
                    borderRadius: radii.md,
                    backgroundColor: colors.signal,
                    opacity: pressed ? 0.75 : 1,
                  })}
                >
                  <Text style={{ fontFamily: font.bold, fontSize: 14, color: colors.ink, letterSpacing: 0.2 }}>
                    Log {p.name}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : (
            /* A site with nothing to put in it is still worth tapping —
               recency is the thing you came to read. Saying why there is no
               button beats showing a dead one. */
            <Text style={type.meta}>
              {pending.length === 0
                ? "Everything due today is logged."
                : "Nothing due today goes here."}
            </Text>
          )}
        </View>
      )}

      {/* Hidden once the day is done, because it would open a picker with
          nothing to log. The dose rows below this panel are the way to reach
          a specific peptide. */}
      {pending.length > 0 && (
        <Pressable
          onPress={onOpenList}
          accessibilityRole="button"
          style={({ pressed }) => ({ minHeight: 44, justifyContent: "center", opacity: pressed ? 0.7 : 1 })}
        >
          <Text style={[type.meta, { color: colors.signalInk, fontFamily: font.semibold }]}>
            Choose from a list
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** Touch target for a site, narrower on the head. See TOUCH_FIXED. */
function hit(site: InjectionSite): number {
  return site.kind === "fixed" ? TOUCH_FIXED : TOUCH;
}

/**
 * How long since this site was used, as the one sentence the bar and the
 * screen reader both need. A fixed site is excluded from recency because
 * "your nose was last used 2 days ago" is not information anyone can act on.
 */
function recency(site: InjectionSite, used: number, days: number | undefined): string {
  if (site.kind === "fixed") {
    return used > 0 ? `${used} today` : "Not taken today";
  }
  if (used > 0) return used > 1 ? `Used ${used}× today` : "Used today";
  if (days === undefined) return "Not used yet";
  if (days === 1) return "Last used yesterday";
  return `Last used ${days} days ago`;
}

/*
  One site.

  Drawn at the coordinates in injectionSites.ts, which are measured against
  the figure in BodyFigure.tsx and are not transferable to another drawing of
  a human being: the set before this one came off a figure with different
  proportions and put the deltoids on the chest and the thigh sites at the
  knees.
*/
function SiteMark({
  site,
  used,
  days,
  isNext,
  isSelected,
}: {
  site: InjectionSite;
  used: number;
  days: number | undefined;
  isNext: boolean;
  isSelected: boolean;
}) {
  return (
    <G>
      {used > 0 ? (
        <>
          {/*
            A halo, so a used site reads at the size of a mark rather than
            the size of a dot. It is the signal colour at low alpha, which
            lifts the disc off the contour where a site sits on a limb edge.

            Fixed sites get a smaller one, because they live on the head.
            The torso can carry a 20-unit halo; a head that measures 37
            units across cannot — at body scale the mark swallowed the face,
            and the nose and the mouth sit 8 units apart, so two full-size
            marks on a stack running both a nasal and an oral peptide
            overlapped into a single blob.
          */}
          <Circle
            cx={site.x}
            cy={site.y}
            r={site.kind === "fixed" ? 6.5 : 10}
            fill={colors.signal}
            opacity={0.22}
          />
          <Circle
            cx={site.x}
            cy={site.y}
            r={site.kind === "fixed" ? 4 : 6.5}
            fill={colors.signalInk}
          />

          {used > 1 &&
            (site.kind === "rotating" ? (
              /*
                Two doses into the same site on the same day is the thing
                rotation exists to prevent, so it gets a drawn difference
                rather than a darker fill: a ring, which survives greyscale.
              */
              <Circle
                cx={site.x}
                cy={site.y}
                r={10.5}
                fill="none"
                stroke={colors.signalInk}
                strokeWidth={1.5}
              />
            ) : (
              /*
                A fixed site has no rotation to violate. Three oral doses in
                a day is the schedule working, so it counts rather than
                warns — the same ring here would be the diagram inventing a
                problem.
              */
              <SvgCount x={site.x + 9} y={site.y} n={used} />
            ))}
        </>
      ) : (
        <Circle cx={site.x} cy={site.y} r={restR(site, days)} fill={restFill(site, days)} />
      )}

      {/*
        Where the rotation goes next: the only OPEN mark on the figure, so it
        reads against a field of filled ones by shape rather than by weight.
        It sits on the palest region by definition, which is exactly why it
        cannot be encoded as another shade.
      */}
      {isNext && used === 0 && (
        <Circle
          cx={site.x}
          cy={site.y}
          r={9}
          fill="none"
          stroke={colors.signalInk}
          strokeWidth={1.75}
          strokeDasharray="3 3"
        />
      )}

      {/* The current selection, drawn outside everything else so it reads as
          a cursor rather than as another state of the site. */}
      {isSelected && (
        <Circle
          cx={site.x}
          cy={site.y}
          r={site.kind === "fixed" ? 8.5 : 13}
          fill="none"
          stroke={colors.ink}
          strokeWidth={1.5}
        />
      )}
    </G>
  );
}

/*
  Recovery, as weight.

  Heaviest is most recently used, which runs the same way the filled disc
  does, so the whole figure reads as one scale: a dark cluster is a region
  being hammered and a pale spread is a rotation working. The buckets are
  coarse on purpose — nothing in this app knows how long tissue actually
  takes to recover, and a continuous gradient would imply a precision that
  claim does not have.

  A fixed site never shades: there is no rotation to be partway through.
*/
function restFill(site: InjectionSite, days: number | undefined): string {
  if (site.kind === "fixed" || days === undefined) return colors.hairline2;
  if (days <= 2) return colors.rampMid;
  if (days <= 6) return colors.rampLight;
  return colors.hairline2;
}

function restR(site: InjectionSite, days: number | undefined): number {
  if (site.kind === "fixed" || days === undefined) return 3;
  if (days <= 2) return 5;
  if (days <= 6) return 4;
  return 3;
}

/*
  A small numeral on the figure, for a fixed site taken more than once.

  Drawn on a filled puck so the digit survives landing on the head contour,
  and offset to the side of the disc rather than centred in it — a numeral
  inside the mark would make a taken dose and a count look like two versions
  of one thing, when the mark means "taken" and the number means "how many".
*/
function SvgCount({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <G>
      <Circle cx={x} cy={y} r={5.5} fill={colors.panel} stroke={colors.signalInk} strokeWidth={1.25} />
      <SvgLabel
        x={x}
        y={y + 3.2}
        fill={colors.signalInk}
        fontSize={9}
        fontWeight="bold"
        textAnchor="middle"
      >
        {n}
      </SvgLabel>
    </G>
  );
}
