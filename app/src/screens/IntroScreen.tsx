/*
The intro carousel.

Structure taken from X Money's setup flow, which solves a problem this app
had: it opened on a form. The first thing anyone saw was a question about
their date of birth, from a product that had not yet said what it was for.

The pattern is a stage and a stable base. A graphic animates in the upper
half, a line of type says what it means, and underneath that NOTHING MOVES —
the action sits in the same place on every slide, at the same size, with the
same words. That stillness is what makes the motion above read as flow rather
than as a screen reassembling itself four times. The moment the button shifts
by eight pixels between slides, the whole thing feels loose, so the headline
block is a fixed height and the stage is a fixed height, and neither is
allowed to size itself to its content.

The graphics are the app's own components fed sample data, not illustrations
of them. The matrix on slide two is the same ProtocolMatrix that draws the
home screen, and the body chart on slide three is the one in the injection
picker. A drawn mock-up of a feature is a promise; the real component is the
thing itself, and it cannot drift out of date.
*/
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Path } from "react-native-svg";
import { BodyFigure } from "../components/BodyFigure";
import { ItemLane } from "../components/ItemGraphics";
import { ProtocolMatrix } from "../components/ProtocolMatrix";
import { LogoMark } from "../components/Logo";
import { DUR, EASE, dur, useReduceMotion } from "../components/motion";
import { buildMatrix } from "../lib/lanes";
import type { CellState } from "../lib/lanes";
import { ROUTE_SITES } from "../lib/injectionSites";
import { colors, font, radii, space, type } from "../theme";

/* ------------------------------------------------------------ fixed metrics */

/*
  The copy block is a fixed height on purpose. If it sizes to its text, the
  button lands somewhere different on every slide and the sequence reads as
  four screens rather than one.

  The stage is NOT fixed — it takes whatever is left after the copy, the dots
  and the action, and centres its graphic in that. Fixing it to a guessed
  number did two things wrong at once: it clipped the taller graphics on a
  normal phone, and on a large one it left a dead band of background between
  the dots and the button that made the screen look unfinished. Flexing keeps
  the promise that matters — every slide gets the SAME area on a given device
  — without pretending to know how tall a device is.
*/
const COPY_H = 132;

/** Height for the body chart, which has to pick one rather than flex. */
const FIGURE_H = 250;

/** How long a slide holds before advancing on its own. */
const DWELL = 3600;

/* ------------------------------------------------------------ sample data */

const DAY = 86400000;

/*
  Sample data for the stage, built once.

  These are plausible, not impressive: a stack of three with a fortnight of
  mostly-but-not-entirely kept doses. An onboarding that shows a perfect
  record sets up the first real screen — which will have one logged dose on
  it — as a disappointment.
*/
function sampleMatrix(now: number) {
  const items = [
    { id: "a", peptideName: "BPC-157", scheduleDays: [1, 3, 5], startedAt: new Date(now - 40 * DAY).toISOString(), cycleOnDays: null, cycleOffDays: null },
    { id: "b", peptideName: "MK-677", scheduleDays: [1, 2, 3, 4, 5, 6, 7], startedAt: new Date(now - 40 * DAY).toISOString(), cycleOnDays: null, cycleOffDays: null },
    { id: "c", peptideName: "GHK-Cu", scheduleDays: [2, 4, 6], startedAt: new Date(now - 40 * DAY).toISOString(), cycleOnDays: null, cycleOffDays: null },
  ];

  const logs: { stackItemId: string; takenAt: string }[] = [];
  for (let d = 21; d >= 1; d--) {
    const date = new Date(now - d * DAY);
    const dow = date.getDay() === 0 ? 7 : date.getDay();
    items.forEach((item) => {
      if (!item.scheduleDays.includes(dow)) return;
      // A couple of deliberate gaps, so the picture has something to say.
      if (d === 9 || (d === 14 && item.id === "b") || (d === 4 && item.id === "c")) return;
      logs.push({ stackItemId: item.id, takenAt: date.toISOString() });
    });
  }

  return buildMatrix(items, logs, 21, new Date(now));
}

/* ----------------------------------------------------------------- stages */

function StackStage({ now }: { now: number }) {
  const matrix = useMemo(() => sampleMatrix(now), [now]);
  const rows = [
    { name: "BPC-157", dose: "1 mg", schedule: "Mon · Wed · Fri" },
    { name: "MK-677", dose: "25 mg", schedule: "Every day" },
    { name: "GHK-Cu", dose: "2 mg", schedule: "Tue · Thu · Sat" },
  ];

  return (
    <View style={{ alignSelf: "stretch", gap: space.sm }}>
      {rows.map((row, i) => (
        <View
          key={row.name}
          style={{
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.hairline,
            borderRadius: radii.lg,
            paddingVertical: space.sm,
            paddingHorizontal: space.md,
            gap: 5,
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline" }}>
            <Text style={type.headingSm}>{row.name}</Text>
            <Text style={[type.statSm, { color: colors.ink }]}>{row.dose}</Text>
          </View>
          <Text style={type.metaSm}>{row.schedule}</Text>
          <ItemLane cells={matrix.lanes[i]?.cells ?? []} days={21} />
        </View>
      ))}
    </View>
  );
}

function MatrixStage({ now }: { now: number }) {
  const matrix = useMemo(() => sampleMatrix(now), [now]);
  return (
    <View
      style={{
        alignSelf: "stretch",
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: radii.xl,
        padding: space.lg,
      }}
    >
      <ProtocolMatrix matrix={matrix} />
    </View>
  );
}

function SitesStage({ reduced }: { reduced: boolean }) {
  const sites = ROUTE_SITES.SubQ.filter((s) => s.view === "front");
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    pop.setValue(0);
    const anim = Animated.timing(pop, {
      toValue: 1,
      duration: dur(700, reduced),
      easing: EASE,
      // Driving SVG opacity: react-native-svg has no native-driver support.
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      pop.setValue(1);
    };
  }, [pop, reduced]);

  return (
    <Svg width={FIGURE_H * (200 / 360)} height={FIGURE_H} viewBox="0 0 200 360">
      <BodyFigure view="front" color={colors.edge} />
      {sites.map((s, i) => (
        <AnimatedSite key={s.id} x={s.x} y={s.y} pop={pop} index={i} total={sites.length} />
      ))}
    </Svg>
  );
}

const ACircle = Animated.createAnimatedComponent(Circle);

/** Markers arrive in sequence rather than all at once, so the eye follows a
 *  rotation around the body instead of being handed a finished diagram. */
function AnimatedSite({
  x, y, pop, index, total,
}: { x: number; y: number; pop: Animated.Value; index: number; total: number }) {
  const start = (index / total) * 0.55;
  const opacity = pop.interpolate({
    inputRange: [start, Math.min(1, start + 0.45)],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const r = pop.interpolate({
    inputRange: [start, Math.min(1, start + 0.45)],
    outputRange: [2, 7],
    extrapolate: "clamp",
  });

  return (
    <>
      <ACircle cx={x} cy={y} r={r} fill={colors.panel} stroke={colors.signalInk} strokeWidth={2} opacity={opacity} />
    </>
  );
}

function TrendStage({ reduced }: { reduced: boolean }) {
  const W = 260;
  const H = 150;
  const pts = [196, 194.5, 193.2, 193.6, 191.4, 190.1, 188.8, 188.2, 186.5];
  const lo = 184;
  const hi = 198;

  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    draw.setValue(0);
    const anim = Animated.timing(draw, {
      toValue: 1,
      duration: dur(900, reduced),
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    });
    anim.start();
    return () => {
      anim.stop();
      draw.setValue(1);
    };
  }, [draw, reduced]);

  const d = pts
    .map((v, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - ((v - lo) / (hi - lo)) * H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  // Dash the whole path and retract the offset — the line draws itself.
  const LEN = 420;
  const APath = Animated.createAnimatedComponent(Path);
  const offset = draw.interpolate({ inputRange: [0, 1], outputRange: [LEN, 0], extrapolate: "clamp" });

  return (
    <View
      style={{
        alignSelf: "stretch",
        backgroundColor: colors.panel,
        borderWidth: 1,
        borderColor: colors.hairline,
        borderRadius: radii.xl,
        padding: space.lg,
        gap: space.sm,
      }}
    >
      <Text style={type.label}>Weight trend</Text>
      <View style={{ flexDirection: "row", alignItems: "baseline", gap: space.sm }}>
        <Text style={[type.statLg, { color: colors.ink }]}>186</Text>
        <Text style={[type.unit]}>lb</Text>
        <Text style={{ fontFamily: font.semibold, fontSize: 13, color: colors.ink2 }}>−9.5 lb since May</Text>
      </View>
      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        {[0, 1, 2, 3].map((i) => (
          <Path key={i} d={`M0 ${(i / 3) * H}H${W}`} stroke={colors.hairline} strokeWidth={1} />
        ))}
        <APath
          d={d}
          stroke={colors.signalInk}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={LEN}
          strokeDashoffset={offset}
        />
      </Svg>
    </View>
  );
}

/* ----------------------------------------------------------------- slides */

interface Slide {
  key: string;
  title: string;
  body: string;
  stage: (ctx: { now: number; reduced: boolean }) => React.ReactNode;
}

const SLIDES: Slide[] = [
  {
    key: "stack",
    title: "Everything you're running",
    body: "Each compound with its dose, its schedule and any on-off cycle — and three weeks of whether you actually took it.",
    stage: ({ now }) => <StackStage now={now} />,
  },
  {
    key: "matrix",
    title: "See where you slip",
    body: "One row per peptide, one column per day. A gap every Thursday is obvious here and invisible in a percentage.",
    stage: ({ now }) => <MatrixStage now={now} />,
  },
  {
    key: "sites",
    title: "Rotate every site",
    body: "Pin where each injection went. The app tracks the rotation so the same spot doesn't take two in a row.",
    stage: ({ reduced }) => <SitesStage reduced={reduced} />,
  },
  {
    key: "trend",
    title: "Know if it's working",
    body: "Weight, energy and mood over time. The only honest answer to whether any of this is doing anything.",
    stage: ({ reduced }) => <TrendStage reduced={reduced} />,
  },
];

/* ------------------------------------------------------------------ screen */

export function IntroScreen({ onDone }: { onDone: () => void }) {
  const insets = useSafeAreaInsets();
  const reduced = useReduceMotion();
  const [index, setIndex] = useState(0);
  // Sample data is generated against one instant, so it does not shift under
  // the user if a slide re-renders.
  const now = useMemo(() => Date.now(), []);

  /*
    Auto-advance stops permanently the moment the user touches a dot.

    A carousel that keeps moving after someone has taken hold of it is
    fighting them: they tapped back to slide two to read it, and it slides
    away mid-sentence. Taking over is a one-way door.
  */
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto || reduced) return;
    const t = setTimeout(() => setIndex((i) => (i + 1) % SLIDES.length), DWELL);
    return () => clearTimeout(t);
  }, [auto, index, reduced]);

  const pick = useCallback((i: number) => {
    setAuto(false);
    setIndex(i);
  }, []);

  const slide = SLIDES[index];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top }}>
      {/* ------------------------------------------------------------ mark */}
      <View style={{ alignItems: "center", paddingVertical: space.lg }}>
        <LogoMark size={28} />
      </View>

      {/* ----------------------------------------------------------- stage */}
      <View
        style={{
          flex: 1,
          marginHorizontal: space.xl,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {/* Keyed, so changing slide remounts and the entrance runs again. */}
        <StageFade key={slide.key} reduced={reduced}>
          {slide.stage({ now, reduced })}
        </StageFade>
      </View>

      {/* ------------------------------------------------------------ copy */}
      <View style={{ height: COPY_H, paddingHorizontal: space.xl, paddingTop: space.xl }}>
        <StageFade key={`${slide.key}-copy`} reduced={reduced}>
          <Text
            style={{
              fontFamily: font.display,
              fontSize: 32,
              lineHeight: 36,
              color: colors.ink,
              textAlign: "center",
            }}
          >
            {slide.title}
          </Text>
          <Text
            style={[
              type.body,
              { color: colors.ink2, textAlign: "center", marginTop: space.sm, lineHeight: 21 },
            ]}
          >
            {slide.body}
          </Text>
        </StageFade>
      </View>

      {/* ------------------------------------------------------------ dots */}
      <View style={{ flexDirection: "row", justifyContent: "center", gap: 7, paddingVertical: space.lg }}>
        {SLIDES.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => pick(i)}
            accessibilityRole="button"
            accessibilityLabel={`Go to slide ${i + 1} of ${SLIDES.length}: ${s.title}`}
            // The dot is 7px; the target around it is not.
            hitSlop={{ top: 14, bottom: 14, left: 8, right: 8 }}
          >
            <View
              style={{
                width: i === index ? 20 : 7,
                height: 7,
                borderRadius: 999,
                backgroundColor: i === index ? colors.signalInk : colors.track,
              }}
            />
          </Pressable>
        ))}
      </View>

      {/* ----------------------------------------------------------- action */}
      <View style={{ paddingHorizontal: space.xl, paddingBottom: Math.max(insets.bottom, space.lg), gap: space.md }}>
        <Pressable
          onPress={onDone}
          accessibilityRole="button"
          style={({ pressed }) => ({
            minHeight: 52,
            borderRadius: 999,
            backgroundColor: colors.signalInk,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <Text style={{ fontFamily: font.bold, fontSize: 16, color: colors.panel, letterSpacing: 0.2 }}>
            Get started
          </Text>
        </Pressable>

        {/*
          The fine print belongs here and is not boilerplate. This app records
          what someone has decided to take; it does not tell them what to
          take, and that line is the difference between a log book and a
          prescription. It is worth saying before the first question, not
          buried in a settings screen.
        */}
        <Text style={[type.metaSm, { textAlign: "center", lineHeight: 15 }]}>
          peptide-RX is a tracking tool. It records what you choose to take and when — it does not
          recommend compounds, doses or schedules, and it is not medical advice.
        </Text>
      </View>
    </View>
  );
}

/** Fade and rise, remounted per slide. Short, because it runs every 3.6s. */
function StageFade({ children, reduced }: { children: React.ReactNode; reduced: boolean }) {
  const p = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    p.setValue(0);
    const anim = Animated.timing(p, {
      toValue: 1,
      duration: dur(DUR.enter, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      // The resting state is visible. Never leave a slide faded out.
      p.setValue(1);
    };
  }, [p, reduced]);

  return (
    <Animated.View
      style={{
        opacity: p,
        transform: [
          { translateY: p.interpolate({ inputRange: [0, 1], outputRange: [reduced ? 0 : 10, 0], extrapolate: "clamp" }) },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
