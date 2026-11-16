/*
The top of the Today screen.

A ring again, by decision. It was a row of countable segments for a while on
the argument that doses are integers and a continuous arc asks the reader to
estimate a proportion when the honest answer is a pair of whole numbers. That
argument is sound and the ring still answers it, because the ratio is printed
inside the ring rather than beside it: the figure is the reading, the arc is
how far round the day has got. Nothing is being estimated off the arc.

What the segments could not do is hold a centre. Eight points of bar under a
line of type has no focal point, so the upper third of the screen had nothing
in it to look at and the page opened flat. A ring with a numeral in it is one
object, and it is the same object the tour points at and calls a ring.

Still not a grade. There is no colour ramp on the arc and no word under the
number: a day with one of two doses logged at four in the afternoon is not a
failing day, and a gauge that turns amber at 50% would say it was.
*/
import { Text, View } from "react-native";
import { CircularProgress } from "./CircularProgress";
import { colors, radii, space, type } from "../theme";

/* Large enough to carry a 38px numeral with room around it, small enough to
   leave the outstanding names a readable column beside it on a 360pt phone. */
const RING = 128;

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
  const progress = due > 0 ? done / due : 0;

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
      <Text style={type.label}>Doses</Text>

      {due === 0 ? (
        /*
          A rest day is not zero out of zero. "0" is a quantity and this is
          the absence of one, and a ring at 0% would draw an empty gauge for
          a day the protocol deliberately leaves empty, which looks like a
          day that went wrong.
        */
        <View style={{ gap: 2 }}>
          <Text style={[type.statLg, { color: colors.ink }]}>Rest day</Text>
          <Text style={type.meta}>{restingToday ? "Off-cycle" : "Nothing scheduled"}</Text>
        </View>
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: space.xl }}>
          <View
            style={{ width: RING, height: RING, alignItems: "center", justifyContent: "center" }}
            accessibilityLabel={`${done} of ${due} doses logged today`}
          >
            <CircularProgress size={RING} stroke={9} progress={progress} />

            {/*
              Absolute, so the numeral is centred on the ring's own middle
              rather than on the middle of a column that also holds the "of"
              line. Hidden from the reader of the screen because the box
              around it already carries the whole ratio as one label.
            */}
            <View
              style={{ position: "absolute", alignItems: "center" }}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            >
              <Text style={[type.statLg, { color: complete ? colors.signalInk : colors.ink }]}>
                {done}
              </Text>
              <Text style={[type.metaSm, { marginTop: -2 }]}>of {due}</Text>
            </View>
          </View>

          <View style={{ flex: 1, gap: 4 }}>
            <Text style={[type.heading, { color: complete ? colors.signalInk : colors.ink }]}>
              {complete ? "All logged" : `${due - done} outstanding`}
            </Text>
            {dueNames.length > 0 && (
              <Text style={type.meta} numberOfLines={3}>
                {dueNames.join(", ")}
              </Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}
