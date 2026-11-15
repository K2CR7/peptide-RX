/*
The top of the Today screen.

What was here: a 56px ring with nothing in it beside the text "0/2". At zero
the ring is an empty grey donut — the largest object in the upper third of
the screen, carrying no information, and restating a number sitting two
millimetres to its right. Nothing on the screen had any visual weight, so the
page opened on grey.

A ring is also the wrong instrument for this. It is a continuous gauge, and
doses are counted on one hand: two due, one logged. A continuous arc asks the
reader to estimate a proportion when the honest answer is a pair of integers.
Segments can be counted. Two due draws two segments, and a filled one is a
dose that happened.

The big figure is the same move the Fuel screen already makes with its daily
target, and that is the screen in this app that reads best. One number at a
size you can see from arm's length, its unit beside it at a quieter weight,
and everything else supporting it.
*/
import { Text, View } from "react-native";
import { colors, font, radii, space, type } from "../theme";

export function TodayHero({
  done,
  due,
  dueNames,
  restingToday,
}: {
  done: number;
  due: number;
  /** Names of what is still outstanding, in schedule order. */
  dueNames: string[];
  /** True when the protocol asks for nothing today. */
  restingToday: boolean;
}) {
  const complete = due > 0 && done === due;

  return (
    <View
      style={{
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: radii.xl,
        padding: space.xl,
        gap: space.md,
      }}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
        <Text style={type.label}>Doses</Text>
        {complete && (
          <Text style={{ fontFamily: font.semibold, fontSize: 11, letterSpacing: 0.5, color: colors.signalInk }}>
            ALL LOGGED
          </Text>
        )}
      </View>

      {due === 0 ? (
        /*
          A rest day is not zero out of zero. "0" is a quantity and this is
          the absence of one — printing a figure here would make a day the
          protocol deliberately leaves empty look like a day that went wrong.
        */
        <View style={{ gap: 2 }}>
          <Text style={[type.statLg, { color: colors.ink }]}>Rest day</Text>
          <Text style={type.meta}>{restingToday ? "Off-cycle" : "Nothing scheduled"}</Text>
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
            <Text
              style={[type.display, { color: complete ? colors.signalInk : colors.ink }]}
              accessibilityLabel={`${done} of ${due} doses logged today`}
            >
              {done}
            </Text>
            <Text style={[type.statSm, { color: colors.ink3 }]}>of {due}</Text>
            <Text style={[type.body, { color: colors.ink2, marginLeft: 2 }]}>
              {due === 1 ? "dose" : "doses"}
            </Text>
          </View>

          {/*
            One segment per dose. The gaps are what make them countable, so
            they stay the same width however many there are; the segments take
            the remaining space. Above about a dozen doses this would stop
            being countable, but a day with twelve due doses has a bigger
            problem than its progress bar.
          */}
          <View
            style={{ flexDirection: "row", gap: 3 }}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {Array.from({ length: due }, (_, i) => (
              <View
                key={i}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: radii.hair,
                  backgroundColor: i < done ? colors.signalInk : colors.track,
                  borderWidth: i < done ? 0 : 1,
                  borderColor: colors.hairline2,
                }}
              />
            ))}
          </View>

        </>
      )}
    </View>
  );
}
