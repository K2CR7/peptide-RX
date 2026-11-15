/*
The protocol, drawn.

One lane per peptide, one column per day, four weeks across. This is the
screen's dominant graphic and it replaces two things that were each spending
a lot of ink to say very little: a 190px ring holding a single percentage,
and a streak integer. Neither could tell you *where* you slip. A matrix can —
a column of gaps every Thursday, or one lane that empties when the cycle
turns, is visible at a glance and invisible in a percentage.

Drawn, not laid out. Every cell of one state is merged into a single <Path>,
so the whole graphic is about six SVG nodes rather than one per cell plus a
shadow view each. react-native-svg costs per node, and a 28x4 grid built from
<Rect> elements is 112 of them.

Nothing is animated per-cell. A grid where every square pops in is a game
board; this fades in once, as a whole, and then sits still.

A missed day is an outline, not an alarm.

The first build drew misses with an amber edge and a diagonal slash. On real
data that is what most of the grid is — somebody running two daily peptides
and logging three doses in a month gets 54 amber boxes, and the graphic stops
being a record and becomes a scolding. Amber is for something that needs
acting on now; a dose that was not logged three weeks ago is not that.

So the states separate by SHAPE, which is the encoding that survives
greyscale and every form of colour blindness without needing a second mark on
top: filled is logged, outlined is due and not logged, nothing drawn is
nothing owed. One colour carries the whole graphic, and amber is left free
for the places in this app that really are warnings.
*/
import { useEffect, useRef } from "react";
import { Animated, Text, View } from "react-native";
import Svg, { Defs, Line, Path, Pattern, Rect } from "react-native-svg";
import type { CellState, Matrix } from "../lib/lanes";
import { EASE, DUR } from "./motion";
import { colors, space, type } from "../theme";

/*
  Cell geometry, in SVG user units that match layout points 1:1.

  These were 11 and 2, chosen so four weeks would fit. On a phone that put
  each cell at about ten points with a two-point gutter, and at that size a
  grid of outlined squares stops reading as a row of marks and starts reading
  as hatching — the eye takes it as one grey texture and skips it. Counting
  anything in it is impossible.

  Fourteen points with a three-point gutter is a mark you can see and count.
  It costs a week of window, which is the right trade: the pattern worth
  spotting is which weekday keeps slipping, and three weeks shows that three
  times over.
*/
const CELL = 14;
const GAP = 3;
const LANE_H = CELL;
const LANE_GAP = 6;
const STEP = CELL + GAP;

/** Builds one path string covering every cell in `picked`. */
function cellsPath(
  lanes: Matrix["lanes"],
  picked: (s: CellState) => boolean,
  inset = 0,
): string {
  let d = "";
  lanes.forEach((lane, row) => {
    const y = row * (LANE_H + LANE_GAP) + inset;
    lane.cells.forEach((state, col) => {
      if (!picked(state)) return;
      const x = col * STEP + inset;
      const s = CELL - inset * 2;
      d += `M${x} ${y}h${s}v${s}h${-s}Z`;
    });
  });
  return d;
}

/*
  One swatch, drawn the same way the cell is drawn.

  A legend that approximates its graphic is worse than none, because the
  reader trusts it and then misreads the picture. These use the same fill,
  the same stroke and the same inset as cellsPath, so a swatch cannot drift
  away from the thing it explains.
*/
function Swatch({ state }: { state: CellState }) {
  const SW = 9;
  return (
    <Svg width={SW} height={SW}>
      {state === "off" ? (
        <>
          <Defs>
            <Pattern id="legendhatch" patternUnits="userSpaceOnUse" width={5} height={5}>
              <Line x1={0} y1={5} x2={5} y2={0} stroke={colors.hairline2} strokeWidth={1} />
            </Pattern>
          </Defs>
          <Rect x={0} y={0} width={SW} height={SW} fill="url(#legendhatch)" />
        </>
      ) : state === "logged" ? (
        <Rect x={0} y={0} width={SW} height={SW} fill={colors.signalInk} />
      ) : (
        <Rect
          x={0.5}
          y={0.5}
          width={SW - 1}
          height={SW - 1}
          fill="none"
          stroke={colors.edge}
          strokeWidth={1}
        />
      )}
    </Svg>
  );
}

function LegendItem({ state, label }: { state: CellState; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
      <Swatch state={state} />
      <Text style={type.metaSm}>{label}</Text>
    </View>
  );
}

export function ProtocolMatrix({ matrix }: { matrix: Matrix }) {
  const { lanes, dates, logged, due, offDays, recordDays } = matrix;

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.timing(enter, {
      toValue: 1,
      duration: DUR.enter,
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      // The resting state is the reading. It must never depend on the
      // animation having run.
      enter.setValue(1);
    };
  }, [enter]);

  if (lanes.length === 0) return null;

  const cols = dates.length;
  const w = cols * STEP - GAP;
  const h = lanes.length * (LANE_H + LANE_GAP) - LANE_GAP;

  // Week boundaries, so four weeks read as four weeks.
  let weekRules = "";
  dates.forEach((d, i) => {
    if (i === 0 || d.getDay() !== 1) return;
    const x = i * STEP - GAP / 2;
    weekRules += `M${x} ${-3}L${x} ${h + 3}`;
  });

  const todayX = (cols - 1) * STEP;
  const hasMissed = lanes.some((lane) => lane.cells.includes("missed"));

  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={type.label}>Last three weeks</Text>
        <Text style={type.metaSm}>
          {recordDays === null
            ? "nothing logged yet"
            : `${logged} of ${due} logged`}
        </Text>
      </View>

      <View style={{ flexDirection: "row", gap: space.sm }}>
        {/* Lane names, outside the drawing, so the SVG stays pure geometry. */}
        <View style={{ justifyContent: "flex-start", paddingTop: 1 }}>
          {lanes.map((lane) => (
            <View key={lane.id} style={{ height: LANE_H, marginBottom: LANE_GAP, justifyContent: "center" }}>
              <Text style={[type.meta, { color: colors.ink2 }]} numberOfLines={1}>
                {lane.name}
              </Text>
            </View>
          ))}
        </View>

        <Animated.View style={{ flex: 1, opacity: enter }}>
          {/*
            The viewBox carries a 1-unit margin on each side. Today's marker
            is drawn one unit outside its cell so the outline doesn't sit on
            the cell edge, which put its right-hand stroke a unit past the
            last column — outside the box, and clipped away on the one column
            it matters most on.
          */}
          <Svg
            width="100%"
            height={h + 6}
            viewBox={`${-1} ${-3} ${w + 2} ${h + 6}`}
            preserveAspectRatio="none"
          >
            <Defs>
              {/*
                Off-cycle is hatched, never a flat pale fill. A faint solid
                square reads as "logged, quietly" — the one reading it must
                not have, since an off day is the protocol working.
              */}
              <Pattern id="offhatch" patternUnits="userSpaceOnUse" width={5} height={5}>
                <Line x1={0} y1={5} x2={5} y2={0} stroke={colors.hairline2} strokeWidth={1} />
              </Pattern>
            </Defs>

            {/* Week rules sit under everything. */}
            <Path d={weekRules} stroke={colors.hairline} strokeWidth={1} />

            {/* Off-cycle: hatch. */}
            <Path d={cellsPath(lanes, (s) => s === "off")} fill="url(#offhatch)" />

            {/* Logged: solid. The only filled state. */}
            <Path d={cellsPath(lanes, (s) => s === "logged")} fill={colors.signalInk} />

            {/* Due and not logged: an outline. The absence IS the reading. */}
            <Path
              d={cellsPath(lanes, (s) => s === "missed", 0.5)}
              fill="none"
              stroke={colors.edge}
              strokeWidth={1}
            />

            {/* Today, still open: dashed edge — neither kept nor lost. */}
            <Path
              d={cellsPath(lanes, (s) => s === "pending", 0.5)}
              fill="none"
              stroke={colors.signalInk}
              strokeWidth={1}
              strokeDasharray={[2, 2]}
            />

            {/* Today's column, marked across every lane. */}
            <Rect
              x={todayX - 1}
              y={-3}
              width={CELL + 2}
              height={h + 6}
              fill="none"
              stroke={colors.ink}
              strokeWidth={1}
            />
          </Svg>
        </Animated.View>
      </View>

      {/*
        Quantified. A graphic without its numbers is a shape; these are the
        same window the matrix draws, so the caption and the picture can
        never disagree — including the denominator, which counts only the
        days that are on record rather than the whole window.
      */}
      {/*
        Named, not just drawn. Shape alone separates the states reliably, but
        it does not say which shape is which — and a reader who has to infer
        that a filled square means "logged" is one wrong guess from reading
        their own adherence backwards.

        Only the states actually on screen are listed. A legend entry for
        something the graphic doesn't contain is a thing to look for and fail
        to find.
      */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.md, rowGap: space.xs }}>
        <LegendItem state="logged" label="Logged" />
        {hasMissed && <LegendItem state="missed" label="Not logged" />}
        {offDays > 0 && <LegendItem state="off" label="Off-cycle" />}
      </View>

      {offDays > 0 && (
        <Text style={type.metaSm}>{offDays} off-cycle {offDays === 1 ? "day" : "days"} in this window</Text>
      )}
    </View>
  );
}
