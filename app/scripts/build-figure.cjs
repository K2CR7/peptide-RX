/*
  Turns the generated chart into app/src/components/BodyFigure.tsx.

    node scripts/build-figure.cjs assets/body-chart.svg src/components/BodyFigure.tsx

  The art in assets/body-chart.svg is a generated clinical body map holding
  both views in one image. Regenerating it means re-running this, and then
  re-measuring every site coordinate in lib/injectionSites.ts against the new
  drawing -- scripts/measure-figure.html prints the body's real edges at each
  height for that. Coordinates are never scaled from the old figure; two
  drawings of a person do not share proportions, and an inherited marker
  points at the wrong part of a body.

  The generator emits one <g id="front"> and one <g id="back">, each holding
  a body outline first and detail elements after it. Both are kept as they
  came: the transform that lands them in the 200x360 space the site
  coordinates live in is applied by the component, not baked into the path
  data, so the source stays diffable against the generated file.
*/
const fs = require("fs");

const [, , svgPath, outPath] = process.argv;
const svg = fs.readFileSync(svgPath, "utf8");

function group(id) {
  const open = svg.indexOf(`<g id="${id}">`);
  const close = svg.indexOf("</g>", open);
  return svg
    .slice(open + `<g id="${id}">`.length, close)
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** `<path d="…" />` or `<circle cx=".." cy=".." r=".." />` → JSX. */
function toJsx(el, indent) {
  const pad = " ".repeat(indent);
  const d = el.match(/\bd="([^"]*)"/);
  if (d) return `${pad}<Path d="${d[1]}" />`;
  const c = el.match(/cx="([^"]*)"\s+cy="([^"]*)"\s+r="([^"]*)"/);
  if (c) return `${pad}<Circle cx={${c[1]}} cy={${c[2]}} r={${c[3]}} />`;
  throw new Error("unhandled element: " + el.slice(0, 80));
}

const front = group("front");
const back = group("back");

// Measured off this exact file: both figures run y 20..~850 at identical
// scale, front centred on x 364 and back on x 804.
const S = 348 / 830.7;
const TY = 4 - 20 * S;
const TXF = 100 - 364 * S;
const TXB = 100 - 804 * S;
const r4 = (n) => Number(n.toFixed(4));

const render = (els) => ({
  outline: toJsx(els[0], 4),
  detail: els.slice(1).map((e) => toJsx(e, 4)).join("\n"),
});

const f = render(front);
const b = render(back);

const file = `/*
The body chart.

Generated line art, redrawn: a single clinical body map holding both the
anterior and the posterior view, produced as ONE image so the two share a
scale and a baseline by construction. Two separate generations would not,
and a front and a back of different people is not a chart you can rotate
doses around.

Drawn to the conventions of a printed patient-education form -- one uniform
contour weight, a lighter weight for interior landmarks, no shading and no
fill -- which is the "informative and medical, never a toy" brief. It is
vector, not raster: it recolours through \`stroke\`, scales to any size, and
costs 5KB, so none of the keying or resolution work a bitmap would have
needed applies.

What this buys over the figure before it: a real nose and a real mouth. The
old head was a featureless oval, so the fixed oral and nasal sites were
pinned to bare coordinates and could only be read by position. They now sit
on drawn features.

THE TRANSFORM IS NOT BAKED INTO THE PATHS. The generated artboard is
1168x880 with the two figures side by side; the numbers below are exactly as
generated, and the group transform is what lands each view in the 200x360
space every site coordinate is expressed in. Keeping them untouched means
this file can still be diffed against the art it came from.

Every site coordinate in injectionSites.ts was re-measured against THIS
figure, by scanning the outline for the body's real edges at each height
rather than by eye. They are not transferable: the set before this one came
off a figure with different proportions, and a marker inherited from one
drawing and placed on another points at the wrong part of a human being.

Landmarks on the current figure, in its own 200x360 space: head y 4..50,
nose y 33, mouth y 42, armpit y 110, navel (100, 146), crotch y 189,
knee y 250, feet y 352.
*/
import { Circle, G, Path } from "react-native-svg";

/** 348 / 830.7 -- the generated figure's height into the diagram's own box. */
export const FIGURE_SCALE = ${r4(S)};

/*
  Split across two nested groups, one transform each, rather than written as
  a single "translate(...) scale(...)". react-native-svg parses a transform
  string itself on native instead of handing it to a browser, and a list of
  two operations is the kind of thing that is read differently there than on
  web -- which would place the whole figure somewhere else on a phone than
  in the dev browser, silently. One operation per group cannot be read two
  ways.
*/
const OFFSET = {
  front: "translate(${r4(TXF)} ${r4(TY)})",
  back: "translate(${r4(TXB)} ${r4(TY)})",
} as const;

const ZOOM = "scale(${r4(S)})";

/*
  Stroke widths are pre-division: they are multiplied by FIGURE_SCALE when
  the group scales, so 2.6 here renders at 1.09 and 1.8 at 0.75. The
  contour and the interior landmarks have to stay distinguishable at a
  56px figure as well as at 240px, which is why the separation is a weight
  and an opacity rather than a colour -- the whole figure is drawn in one
  colour passed by the caller.
*/
const OUTLINE = 2.6;
const DETAIL = 1.8;

const FRONT = (
  <>
    <G strokeWidth={OUTLINE}>
${f.outline}
    </G>
    <G strokeWidth={DETAIL} opacity={0.75}>
${f.detail}
    </G>
  </>
);

const BACK = (
  <>
    <G strokeWidth={OUTLINE}>
${b.outline}
    </G>
    <G strokeWidth={DETAIL} opacity={0.75}>
${b.detail}
    </G>
  </>
);

export function BodyFigure({ view, color }: { view: "front" | "back"; color: string }) {
  return (
    <G transform={OFFSET[view]}>
      <G
        transform={ZOOM}
        fill="none"
        stroke={color}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {view === "front" ? FRONT : BACK}
      </G>
    </G>
  );
}
`;

fs.writeFileSync(outPath, file);
console.log("wrote " + outPath);
console.log("front: outline + " + (front.length - 1) + " detail element(s)");
console.log("back:  outline + " + (back.length - 1) + " detail element(s)");
console.log("scale=" + r4(S) + " txFront=" + r4(TXF) + " txBack=" + r4(TXB) + " ty=" + r4(TY));
