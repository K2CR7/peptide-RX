import { Text, View } from "react-native";
import Svg, { Circle, G, Line } from "react-native-svg";
import { BodyFigure } from "./BodyFigure";
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
        <BodyFigure view={view} color={colors.hairline2} />

        {shown.map((site) => {
          const isSelected = site.id === selectedId;
          const isRecommended = site.id === recommendedId;
          const used = usage[site.id] ?? 0;

          const stroke = isSelected
            ? colors.signalInk
            : isRecommended
              ? colors.signalInk
              : used > 0
                ? colors.amber
                : colors.hairline2;

          return (
            <G key={site.id} onPress={() => onSelect(site.id)}>
              {/* Enlarged, invisible touch target. */}
              <Circle cx={site.x} cy={site.y} r={17} fill="transparent" />

              {isSelected && (
                <Circle cx={site.x} cy={site.y} r={13} fill={colors.signalInk} opacity={0.18} />
              )}

              <Circle
                cx={site.x}
                cy={site.y}
                r={isSelected ? 8.5 : 7}
                fill={isSelected ? colors.signalInk : colors.bg}
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
          fontSize: 11,
          color: colors.ink3,
          marginTop: 8,
          letterSpacing: 0.2,
        }}
      >
        {view === "front"
          ? "Front view. Your left is on the right."
          : "Back view. Your left is on the left."}
      </Text>
    </View>
  );
}
