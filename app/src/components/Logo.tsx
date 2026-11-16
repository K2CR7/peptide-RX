/*
The PeptideRX mark.

Three nodes joined by two bonds — a peptide chain read one way, a trend line
read the other, which is a good deal more than most marks manage.

Redrawn as vector from the supplied PNG rather than imported as a bitmap.
The original is 272px with the tile baked in, so at any size the app actually
needs it is either soft or oversized; these coordinates were measured off it
(node centres, ring radius, stroke weights) so this is the same mark, not an
impression of it. It lives in the logo's own 212-unit square, which is why
the numbers look arbitrary — they are the artwork's, not ours.

The links stop at each ring's centreline instead of running underneath it.
Drawn the other way the bond would show through the hollow middle of a node,
and hiding it would mean filling each node with the background colour, which
only works on one background. This way the mark is correct on any of them.
*/
import Svg, { Circle, Line, Rect } from "react-native-svg";
import { colors } from "../theme";

/** Node centres and ring geometry, in the artwork's 212-unit square. */
const A = { x: 91, y: 79 };
const B = { x: 154, y: 87 };
const C = { x: 57, y: 132 };
const NODE_R = 12.5;
const NODE_W = 7.5;
const LINK_W = 8;

/** The segment from `p` to `q`, shortened to each ring's centreline. */
function bond(p: { x: number; y: number }, q: { x: number; y: number }) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const len = Math.hypot(dx, dy);
  const ux = (dx / len) * NODE_R;
  const uy = (dy / len) * NODE_R;
  return { x1: p.x + ux, y1: p.y + uy, x2: q.x - ux, y2: q.y - uy };
}

const BONDS = [bond(A, B), bond(A, C)];

/**
 * The mark alone, no tile. `color` is the stroke, so it can be white on the
 * teal tile or teal on the app's own ground without a second asset.
 */
export function LogoMark({
  size = 40,
  color = colors.signal,
}: {
  size?: number;
  color?: string;
}) {
  return (
    // The viewBox is the mark's own bounds, not the full square, so `size`
    // means the mark rather than the whitespace it originally sat in.
    <Svg width={size} height={size * (85.5 / 129.5)} viewBox="40.75 62.75 129.5 85.5" fill="none">
      {BONDS.map((b, i) => (
        <Line
          key={i}
          x1={b.x1}
          y1={b.y1}
          x2={b.x2}
          y2={b.y2}
          stroke={color}
          strokeWidth={LINK_W}
        />
      ))}
      {[A, B, C].map((n, i) => (
        <Circle key={i} cx={n.x} cy={n.y} r={NODE_R} stroke={color} strokeWidth={NODE_W} />
      ))}
    </Svg>
  );
}

/** The mark on its teal tile, as the icon draws it. For headers and splashes. */
export function LogoTile({ size = 56 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 212 212">
      {/* rx is the artwork's own 44/212 corner, close to the iOS squircle and
          deliberately NOT the app's tight 4-10px radii. An icon follows the
          platform's convention; the interface inside it follows ours. */}
      <Rect x={0} y={0} width={212} height={212} rx={44} fill={colors.signal} />
      {BONDS.map((b, i) => (
        <Line
          key={i}
          x1={b.x1}
          y1={b.y1}
          x2={b.x2}
          y2={b.y2}
          stroke={colors.panel}
          strokeWidth={LINK_W}
        />
      ))}
      {[A, B, C].map((n, i) => (
        <Circle key={i} cx={n.x} cy={n.y} r={NODE_R} stroke={colors.panel} strokeWidth={NODE_W} />
      ))}
    </Svg>
  );
}
