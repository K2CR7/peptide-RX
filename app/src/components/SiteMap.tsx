/*
Where this week's doses landed, on a body.

What was here: a panel printing "Next site: Left Outer Thigh" over a list of
the last three injections as text rows with a dot and a relative date. Every
fact was present and the one question rotation exists to answer was still
unanswerable at a glance, because that question is spatial — which part of me
have I not used lately — and a column of place NAMES makes the reader rebuild
the body in their head before they can answer it. Six words of anatomy per
row, three rows, and you still have to remember which side "left flank" is on
while you read the next one.

A figure answers it by being looked at. The marks are where the sites are, so
a week spent hammering one side of the abdomen is a cluster, and a week
rotated properly is spread out. Neither needs a caption.

BOTH VIEWS, when the route uses both. An IM protocol rotates between deltoids
on the front and glutes on the back, and that rotation is not visible on one
side of a person. A view with no sites in it is not drawn at all: SubQ has
nothing on the back, and an empty back figure would read as "nothing used
here" rather than "nothing here to use".

TWO MARKS, separated by shape as well as by weight, per the measured limit in
theme.ts — amber and red are 2.2 ΔE apart under deuteranopia, so nothing in
this app may carry state in colour alone:

  filled disc    injected today
  hairline dot   a site that exists and is free

TODAY, AND NOTHING ABOUT TOMORROW. There was a third mark: a dashed ring on
the site the rotation put up next. It is gone, and the reason is worth
keeping. A prediction drawn on a chart of records is a different kind of
claim wearing the same clothes, and this one was a weak claim — getNextSite
returns the first site missing from the last full cycle, which is a sensible
default and not advice. Printing it on a body diagram in the app's own signal
colour dressed it as a recommendation this app is not in a position to make.
The picker still opens on that site when you go to log a dose, which is where
a default belongs: on the control, where you can see it and override it.

The window is today, not the week. A week of marks shows a rotation pattern
and is the better graphic in the abstract; it is also the Week tab's job.
This is the Today screen, so the question it answers is what happened today.
*/
import { useState } from "react";
import { Text, View } from "react-native";
import Svg, { Circle, G } from "react-native-svg";
import { BodyFigure } from "./BodyFigure";
import type { BodyView, InjectionSite } from "../lib/injectionSites";
import { colors, space, type } from "../theme";

/** The space every site coordinate in injectionSites.ts is measured in. */
const VB_W = 200;
const VB_H = 360;

/*
  Two figures side by side have to fit a 360pt phone with the page margins,
  the panel padding and a gap taken out first, which is where 164 comes from.
  A route that only uses one view has that whole budget to itself, and the
  marks are measured in viewBox units — so a narrower figure is not just a
  smaller picture, it is smaller DOTS. One view gets the room.
*/
const MAX_FIGURE_ONE = 208;
const MAX_FIGURE_TWO = 164;

const VIEWS: BodyView[] = ["front", "back"];

interface Props {
  /** Every site the current route can use, both views. */
  sites: InjectionSite[];
  /** How many times each site id was used today. */
  usedToday: Record<string, number>;
  /** Doses pinned to a site today, for the count in the header. */
  count: number;
}

export function SiteMap({ sites, usedToday, count }: Props) {
  /*
    Measured, not assumed.

    The sibling week grid learned this the expensive way: it sized itself
    from a hardcoded 390, which is one specific iPhone, and silently clipped
    days off the right edge of everything narrower. On web this app renders
    inside a fixed-width phone frame, so useWindowDimensions is the browser
    window and has nothing to do with how much room this panel has. onLayout
    is the only number true on both platforms.
  */
  const [boxW, setBoxW] = useState(0);

  const shownViews = VIEWS.filter((v) => sites.some((s) => s.view === v));
  if (shownViews.length === 0) return null;

  const gap = space.lg;
  const cap = shownViews.length === 1 ? MAX_FIGURE_ONE : MAX_FIGURE_TWO;
  const figureW =
    boxW > 0
      ? Math.min(cap, (boxW - gap * (shownViews.length - 1)) / shownViews.length)
      : 0;
  const figureH = (figureW / VB_W) * VB_H;

  return (
    <View style={{ gap: space.md }} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={type.label}>Injection sites</Text>
        <Text style={type.metaSm}>
          {count === 0 ? "none today" : `${count} today`}
        </Text>
      </View>

      {/* Nothing is drawn until the box has been measured once. A figure at
          width 0 is not a cheap frame, it is a frame with the wrong answer
          in it. */}
      {figureW > 0 && (
        <View style={{ flexDirection: "row", justifyContent: "center", gap }}>
          {shownViews.map((view) => (
            <View key={view} style={{ alignItems: "center", gap: space.xs }}>
              <Svg width={figureW} height={figureH} viewBox={`0 0 ${VB_W} ${VB_H}`}>
                {/*
                  A step lighter than the picker's figure draws it, which is
                  not a style choice. The free-site dots are hairline2, and
                  on a hairline2 contour a dot sitting on the edge of a limb
                  — which several of them do, because that is where you
                  inject — disappears into the outline. The figure is the
                  context and the marks are the data, so the figure gives
                  way. The picker has the opposite job: there the body is
                  what you are aiming at.
                */}
                <BodyFigure view={view} color={colors.hairline} />

                {sites
                  .filter((s) => s.view === view)
                  .map((site) => (
                    <SiteMark key={site.id} site={site} used={usedToday[site.id] ?? 0} />
                  ))}
              </Svg>

              {/*
                Which way round the figure faces, because a marker on the
                user's left arm is drawn on the right of a front view and on
                the left of a back one. Without this the whole diagram is
                mirrored half the time and silently wrong.
              */}
              <Text style={type.metaSm}>
                {view === "front" ? "Front" : "Back"}
              </Text>
            </View>
          ))}
        </View>
      )}

      {/*
        No legend. There are two marks left and the header has already said
        which is which — a filled disc against a hairline dot, under the
        words "2 today", needs no key, and a legend that explains two marks
        is longer than the thing it explains.
      */}
    </View>
  );
}

/*
  One site.

  Drawn at the coordinates in injectionSites.ts, which are measured against
  the figure in BodyFigure.tsx and are not transferable to another drawing of
  a human being: the set before this one came off a figure with different
  proportions and put the deltoids on the chest and the thigh sites at the
  knees.
*/
function SiteMark({ site, used }: { site: InjectionSite; used: number }) {
  if (used > 0) {
    return (
      <G>
        {/*
          A halo, so a used site reads at the size of a mark rather than the
          size of a dot. It is the panel's own ground colour at low alpha
          over the figure's contour, which lifts the disc off the outline
          where a site sits right on a limb edge.
        */}
        <Circle cx={site.x} cy={site.y} r={10} fill={colors.signal} opacity={0.22} />
        <Circle cx={site.x} cy={site.y} r={6.5} fill={colors.signalInk} />

        {/*
          Two doses into the same site on the same day is the thing rotation
          exists to prevent, so it gets a drawn difference rather than a
          darker fill: a ring around the disc, which survives greyscale.
        */}
        {used > 1 && (
          <Circle
            cx={site.x}
            cy={site.y}
            r={10.5}
            fill="none"
            stroke={colors.signalInk}
            strokeWidth={1.5}
          />
        )}
      </G>
    );
  }

  return <Circle cx={site.x} cy={site.y} r={3} fill={colors.hairline2} />;
}
