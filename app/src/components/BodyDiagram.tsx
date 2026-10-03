import { Text, View } from "react-native";
import Svg, { Circle, G, Line, Path } from "react-native-svg";
import type { BodyView, InjectionSite } from "../lib/injectionSites";
import { colors, font } from "../theme";

const VB_W = 200;
const VB_H = 360;

interface Props {
  view: BodyView;
  sites: InjectionSite[];
  selectedId: string | null;
  recommendedId: string | null;
  /** How many times each site id has been used, for the rotation load read. */
  usage: Record<string, number>;
  onSelect: (id: string) => void;
  width?: number;
}

/**
 * Anterior/posterior body figure with tappable injection-site markers.
 *
 * Markers carry an oversized transparent hit circle because an anatomically
 * correct marker cannot also be 44pt wide on a figure this size; the site list
 * beside the diagram is the full-size target and the accessible path.
 */
export function BodyDiagram({
  view, sites, selectedId, recommendedId, usage, onSelect, width = 200,
}: Props) {
  const height = (width / VB_W) * VB_H;
  const shown = sites.filter((s) => s.view === view);

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={width} height={height} viewBox={`0 0 ${VB_W} ${VB_H}`}>
        <G opacity={0.9}>
          <Figure view={view} />
        </G>

        {shown.map((site) => {
          const isSelected = site.id === selectedId;
          const isRecommended = site.id === recommendedId;
          const used = usage[site.id] ?? 0;

          const stroke = isSelected
            ? colors.signal
            : isRecommended
              ? colors.signal
              : used > 0
                ? colors.amber
                : colors.hairline2;

          return (
            <G key={site.id} onPress={() => onSelect(site.id)}>
              {/* Enlarged, invisible touch target. */}
              <Circle cx={site.x} cy={site.y} r={17} fill="transparent" />

              {isSelected && (
                <Circle cx={site.x} cy={site.y} r={13} fill={colors.signal} opacity={0.18} />
              )}

              <Circle
                cx={site.x}
                cy={site.y}
                r={isSelected ? 8.5 : 7}
                fill={isSelected ? colors.signal : colors.bg}
                stroke={stroke}
                strokeWidth={isSelected ? 0 : 2}
              />

              {/* Recently-used sites carry a bar, so "avoid this one" is a
                  drawn mark rather than a color the user has to decode. */}
              {used > 0 && !isSelected && (
                <Line
                  x1={site.x - 3}
                  y1={site.y}
                  x2={site.x + 3}
                  y2={site.y}
                  stroke={colors.amber}
                  strokeWidth={2}
                  strokeLinecap="round"
                />
              )}
            </G>
          );
        })}
      </Svg>

      <Text
        style={{
          fontFamily: font.medium,
          fontSize: 11.5,
          color: colors.ink3,
          marginTop: 6,
          letterSpacing: 0.2,
        }}
      >
        {view === "front"
          ? "Front view — your left is on the right"
          : "Back view — your left is on the left"}
      </Text>
    </View>
  );
}

function Figure({ view }: { view: BodyView }) {
  const line = colors.hairline2;
  const fill = colors.panelRaised;
  const stroke = 1.75;

  return (
    <G fill={fill} stroke={line} strokeWidth={stroke} strokeLinejoin="round" strokeLinecap="round">
      {/* head */}
      <Circle cx={100} cy={27} r={16} />
      {/* neck */}
      <Path d="M92 41 L92 56 L108 56 L108 41" />
      {/* torso — shoulders, waist taper, hips */}
      <Path d="M72 62 Q100 53 128 62 L133 116 Q136 150 127 180 L124 208 L76 208 L73 180 Q64 150 67 116 Z" />
      {/* arms, held slightly clear of the torso so the flank stays readable */}
      <Path d="M72 66 Q54 74 50 104 L45 172 Q44 182 50 183 Q57 184 58 175 L64 116" />
      <Path d="M128 66 Q146 74 150 104 L155 172 Q156 182 150 183 Q143 184 142 175 L136 116" />
      {/* legs */}
      <Path d="M76 208 L73 282 L71 338 Q71 347 79 347 Q87 347 87 338 L93 282 L97 212" />
      <Path d="M124 208 L127 282 L129 338 Q129 347 121 347 Q113 347 113 338 L107 282 L103 212" />

      {view === "front" ? (
        <>
          {/* navel — the landmark every abdominal site is described against */}
          <Circle cx={100} cy={161} r={2.5} fill={line} stroke="none" />
        </>
      ) : (
        <>
          {/* spine + waistline, so the back view is not a blank silhouette */}
          <Line x1={100} y1={66} x2={100} y2={200} stroke={line} strokeWidth={1.25} opacity={0.7} />
          <Line x1={78} y1={198} x2={122} y2={198} stroke={line} strokeWidth={1.25} opacity={0.7} />
        </>
      )}
    </G>
  );
}
