/*
Two small graphics that belong to one stack item.

The stack screen was a list of rows reading "BPC-157 / Once weekly · SubQ /
1 mg". Every word of that is something the user typed in when they added the
item, so the screen could only ever tell them what they already told it. The
two things it could not say — have I actually been taking this, and where am
I in the cycle — were the two things worth opening the screen for.

Both are drawn with the same vocabulary as the matrix on the home screen:
filled is logged, outlined is due and not logged, hatched is off-cycle,
nothing drawn means nothing was owed. Learning the encoding once should be
enough for the whole app.
*/
import type { CellState } from "../lib/lanes";
import type { CycleState } from "../lib/cycle";
import { Text, View } from "react-native";
import Svg, { Defs, Line, Path, Pattern, Rect } from "react-native-svg";
import { colors, radii, space, type } from "../theme";

/* ------------------------------------------------------------------ lane */

const CELL = 8;
const GAP = 2;
const STEP = CELL + GAP;

/**
 * One item's recent history, at a glance.
 *
 * Same merge-into-one-path trick as the matrix: a fortnight of <Rect> nodes
 * is 14 views per row, and this renders once per stack item.
 */
export function ItemLane({ cells, days }: { cells: CellState[]; days: number }) {
  const w = cells.length * STEP - GAP;

  let filled = "";
  let outlined = "";
  let hatched = "";
  cells.forEach((state, i) => {
    const x = i * STEP;
    if (state === "logged") filled += `M${x} 0h${CELL}v${CELL}h${-CELL}Z`;
    else if (state === "missed" || state === "pending")
      outlined += `M${x + 0.5} 0.5h${CELL - 1}v${CELL - 1}h${-(CELL - 1)}Z`;
    else if (state === "off") hatched += `M${x} 0h${CELL}v${CELL}h${-CELL}Z`;
  });

  const logged = cells.filter((c) => c === "logged").length;
  const due = cells.filter((c) => c !== "none" && c !== "off").length;

  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
      <Svg
        width={w}
        height={CELL}
        accessibilityLabel={`${logged} of ${due} doses logged in the last ${days} days`}
      >
        <Defs>
          <Pattern id="laneoff" patternUnits="userSpaceOnUse" width={4} height={4}>
            <Line x1={0} y1={4} x2={4} y2={0} stroke={colors.hairline2} strokeWidth={1} />
          </Pattern>
        </Defs>
        <Path d={hatched} fill="url(#laneoff)" />
        <Path d={outlined} fill="none" stroke={colors.edge} strokeWidth={1} />
        <Path d={filled} fill={colors.signalInk} />
      </Svg>
      <Text style={type.metaSm}>
        {due === 0 ? `${days}d` : `${logged}/${due} · ${days}d`}
      </Text>
    </View>
  );
}

/* ----------------------------------------------------------------- cycle */

const BAR_H = 6;

/**
 * Where the item sits in its cycle — drawn as a line, never as a ring.
 *
 * A cycle is a span with a start, a position and an end, and the one thing
 * the user wants off it is "how much longer". A ring answers that badly: it
 * has no visible beginning, so reading progress off one means finding the
 * gap and estimating an angle. A bar puts the answer where reading is
 * already going, left to right, and it can carry the on and off phases at
 * their true relative widths so a 8-on/4-off cycle looks like 8 and 4.
 *
 * The off phase is hatched, matching the matrix, because a pale solid fill
 * reads as a weaker version of the on phase. Off is not less on. It is a
 * different thing, and for most compounds it is the part doing the work.
 */
export function CyclePhaseBar({
  cycle,
  onDays,
  offDays,
  width,
}: {
  cycle: CycleState;
  onDays: number;
  offDays: number;
  width: number;
}) {
  const { phase, dayInPhase, phaseLength, daysRemaining } = cycle;

  /*
    Both phase lengths come from the item, not from the cycle state, which
    only knows about the phase it is currently in. Drawing the whole cycle is
    the point: "day 3 of 28 on" and "day 3 of 14 off" produce identical bars
    otherwise, and a picture that can't tell those apart is saying nothing the
    line of text above it didn't already say.
  */
  const onLen = Math.max(1, onDays);
  const offLen = Math.max(1, offDays);
  const total = onLen + offLen;
  const onW = Math.round((onLen / total) * width);
  const offW = width - onW;

  // Position within the whole cycle, not within the phase.
  const elapsed = phase === "on" ? dayInPhase : onLen + dayInPhase;
  const markX = Math.min(width - 1, Math.max(1, ((elapsed - 0.5) / total) * width));

  return (
    <View style={{ gap: 4 }}>
      <Svg
        width={width}
        height={BAR_H + 6}
        accessibilityLabel={`${phase === "on" ? "On" : "Off"} phase, day ${dayInPhase} of ${phaseLength}, ${daysRemaining} ${daysRemaining === 1 ? "day" : "days"} remaining`}
      >
        <Defs>
          <Pattern id="cycleoff" patternUnits="userSpaceOnUse" width={4} height={4}>
            <Line x1={0} y1={4} x2={4} y2={0} stroke={colors.hairline2} strokeWidth={1} />
          </Pattern>
        </Defs>

        {/* On phase. */}
        <Rect x={0} y={3} width={onW} height={BAR_H} rx={radii.hair} fill={colors.signalDim} />
        {/* The part of the on phase already served. */}
        {phase === "on" && (
          <Rect
            x={0}
            y={3}
            width={Math.max(0, markX)}
            height={BAR_H}
            rx={radii.hair}
            fill={colors.signalInk}
          />
        )}
        {phase === "off" && (
          <Rect x={0} y={3} width={onW} height={BAR_H} rx={radii.hair} fill={colors.signalInk} />
        )}

        {/* Off phase, hatched inside a hairline so the span is readable. */}
        <Rect x={onW} y={3} width={offW} height={BAR_H} fill="url(#cycleoff)" />
        <Rect
          x={onW + 0.5}
          y={3.5}
          width={Math.max(0, offW - 1)}
          height={BAR_H - 1}
          fill="none"
          stroke={colors.hairline2}
          strokeWidth={1}
        />
        {phase === "off" && (
          <Rect
            x={onW}
            y={3}
            width={Math.max(0, markX - onW)}
            height={BAR_H}
            fill={colors.ink3}
            opacity={0.35}
          />
        )}

        {/* Today. Full height, so it reads over either phase. */}
        <Line x1={markX} y1={0} x2={markX} y2={BAR_H + 6} stroke={colors.ink} strokeWidth={1.5} />
      </Svg>
    </View>
  );
}

/** The width an ItemLane of `days` columns will occupy, so a graphic stacked
 *  under it can line up exactly rather than approximately. */
export function laneWidth(days: number): number {
  return days * STEP - GAP;
}
