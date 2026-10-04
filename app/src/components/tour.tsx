/*
The guided tour.

Three pieces:
  - TourProvider   holds which stop is live and where its target sits
  - TourTarget     wraps a real element and reports its on-screen box
  - TourOverlay    draws the scrim, the cutout, the pointer and the caption

The scrim is four rectangles around the target rather than an SVG mask. A
mask would be tidier on paper, but four plain Views measure and reflow
predictably on both native and react-native-web, and this has to be correct
on every screen size rather than elegant on one.

The cutout is a hole in the dimming, not a copy of the element: the real
control stays where it is and stays tappable. That matters at the Stack stop,
where the user adds an actual peptide rather than miming it.
*/
import {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
  type ReactNode,
} from "react";
import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "./primitives";
import { DUR, Fade } from "./motion";
import { colors, radii, space, type } from "../theme";

export interface TourStop {
  id: string;
  /** Tab this stop lives on; the tour switches there before showing it. */
  tab: "Today" | "Week" | "Stack" | "Progress" | "Fuel";
  title: string;
  body: string;
  /**
   * When set, Next is withheld until `notifyAction(id)` fires — used for the
   * one stop where the user does the real thing rather than reading about it.
   */
  requiresAction?: boolean;
  actionHint?: string;
}

interface Box { x: number; y: number; width: number; height: number }

interface TourValue {
  activeId: string | null;
  register: (id: string, box: Box | null) => void;
  notifyAction: (id: string) => void;
}

const TourCtx = createContext<TourValue>({
  activeId: null,
  register: () => {},
  notifyAction: () => {},
});

export function useTour() {
  return useContext(TourCtx);
}

export function TourProvider({
  stops, onFinish, onTabChange, children,
}: {
  stops: TourStop[];
  onFinish: () => void;
  onTabChange: (tab: TourStop["tab"]) => void;
  children: ReactNode;
}) {
  const [index, setIndex] = useState(0);
  const [boxes, setBoxes] = useState<Record<string, Box | null>>({});
  const [actionDone, setActionDone] = useState<Record<string, boolean>>({});

  // Targets report window coordinates, but the overlay's absolutely-positioned
  // panes are laid out inside THIS view. On the web those differ by the whole
  // offset of the phone frame, so without subtracting this origin the cutout
  // lands far outside the visible area and the screen just goes uniformly
  // dark — the highlight silently never appears.
  const rootRef = useRef<View>(null);
  const [origin, setOrigin] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const measureRoot = useCallback(() => {
    rootRef.current?.measureInWindow((x, y) => {
      setOrigin((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
    });
  }, []);

  const stop = stops[index];
  const activeId = stop?.id ?? null;

  const register = useCallback((id: string, box: Box | null) => {
    setBoxes((prev) => {
      const old = prev[id];
      if (old && box && old.x === box.x && old.y === box.y && old.width === box.width && old.height === box.height) {
        return prev; // unchanged — don't churn state on every re-measure
      }
      return { ...prev, [id]: box };
    });
  }, []);

  const notifyAction = useCallback((id: string) => {
    setActionDone((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
  }, []);

  // Move to the right tab whenever the stop changes, and re-measure the root
  // once layout has settled — a tab change can shift it.
  useEffect(() => {
    if (!stop) return;
    onTabChange(stop.tab);
    const t = setTimeout(measureRoot, 180);
    return () => clearTimeout(t);
  }, [stop, onTabChange, measureRoot]);

  // A gated stop releases itself once the real action lands.
  useEffect(() => {
    if (stop?.requiresAction && actionDone[stop.id]) {
      const t = setTimeout(() => setIndex((i) => i + 1), 650);
      return () => clearTimeout(t);
    }
  }, [stop, actionDone]);

  const value = useMemo(() => ({ activeId, register, notifyAction }), [activeId, register, notifyAction]);

  const raw = stop ? boxes[stop.id] ?? null : null;
  const box: Box | null = raw
    ? { ...raw, x: raw.x - origin.x, y: raw.y - origin.y }
    : null;

  return (
    <TourCtx.Provider value={value}>
      <View ref={rootRef} collapsable={false} onLayout={measureRoot} style={{ flex: 1 }}>
        {children}
      </View>
      {stop && (
        <TourOverlay
          stop={stop}
          box={box}
          index={index}
          total={stops.length}
          waiting={!!stop.requiresAction && !actionDone[stop.id]}
          onNext={() => (index + 1 >= stops.length ? onFinish() : setIndex(index + 1))}
          onSkip={onFinish}
        />
      )}
    </TourCtx.Provider>
  );
}

/**
 * Wraps a real element so the tour can find it. Re-measures when the active
 * stop changes, since layout shifts as tabs switch.
 */
export function TourTarget({ id, children, style }: { id: string; children: ReactNode; style?: object }) {
  const ref = useRef<View>(null);
  const { register, activeId } = useTour();

  const measure = useCallback(() => {
    const node = ref.current;
    if (!node) return;
    node.measureInWindow((x, y, width, height) => {
      if (width > 0 && height > 0) register(id, { x, y, width, height });
    });
  }, [id, register]);

  useEffect(() => {
    if (activeId !== id) return;
    // One frame for layout to settle after a tab change, then measure.
    const t = setTimeout(measure, 180);
    return () => clearTimeout(t);
  }, [activeId, id, measure]);

  return (
    <View ref={ref} collapsable={false} onLayout={measure} style={style}>
      {children}
    </View>
  );
}

const PAD = 8;

function TourOverlay({
  stop, box, index, total, waiting, onNext, onSkip,
}: {
  stop: TourStop;
  box: Box | null;
  index: number;
  total: number;
  waiting: boolean;
  onNext: () => void;
  onSkip: () => void;
}) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const hole = box
    ? {
        x: Math.max(0, box.x - PAD),
        y: Math.max(0, box.y - PAD),
        width: box.width + PAD * 2,
        height: box.height + PAD * 2,
      }
    : null;

  // Put the caption on whichever side has more room.
  const below = hole ? hole.y + hole.height : height * 0.4;
  const roomBelow = height - below;
  const captionBelow = !hole || roomBelow > 260;

  const scrim = "rgba(6,8,10,0.86)";

  return (
    <View
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="box-none"
    >
      {/* Four panes around the cutout. Each swallows taps; the hole does not
          exist as a view at all, so the real control underneath stays live. */}
      {hole ? (
        <>
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: 0, height: hole.y, backgroundColor: scrim }} />
          <Pressable style={{ position: "absolute", left: 0, right: 0, top: hole.y + hole.height, bottom: 0, backgroundColor: scrim }} />
          <Pressable style={{ position: "absolute", left: 0, width: hole.x, top: hole.y, height: hole.height, backgroundColor: scrim }} />
          <Pressable style={{ position: "absolute", left: hole.x + hole.width, right: 0, top: hole.y, height: hole.height, backgroundColor: scrim }} />
          {/* Ring around the live element. */}
          <View
            pointerEvents="none"
            style={{
              position: "absolute",
              left: hole.x,
              top: hole.y,
              width: hole.width,
              height: hole.height,
              borderRadius: radii.md,
              borderWidth: 1.5,
              borderColor: colors.signal,
            }}
          />
        </>
      ) : (
        <Pressable style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: scrim }} />
      )}

      {/* Caption */}
      <View
        pointerEvents="box-none"
        style={{
          position: "absolute",
          left: space.xl,
          right: space.xl,
          ...(captionBelow
            ? { top: Math.min(below + space.xl, height - 280) }
            : { bottom: height - (hole?.y ?? 0) + space.xl }),
        }}
      >
        <Fade
          key={stop.id}
          duration={DUR.step}
          style={{
            backgroundColor: colors.panel,
            borderWidth: 1,
            borderColor: colors.hairline2,
            borderRadius: radii.lg,
            padding: space.xl,
            gap: space.sm,
          }}
        >
          <Text style={type.label}>
            {index + 1} of {total}
          </Text>
          <Text style={type.heading}>{stop.title}</Text>
          <Text style={type.bodySm}>{stop.body}</Text>

          {/* A gated stop invites the real action, but Next is always there.
              Withholding it entirely made the tour feel stuck when the thing
              being asked for wasn't obvious. */}
          {waiting && (
            <Text style={[type.bodySm, { color: colors.signal, marginTop: space.sm }]}>
              {stop.actionHint ?? "Give it a go — the tour continues once you do."}
            </Text>
          )}

          <Button
            label={index + 1 >= total ? "Finish" : waiting ? "Skip this step" : "Next"}
            variant={waiting ? "secondary" : "primary"}
            onPress={onNext}
            size="sm"
            style={{ marginTop: space.sm }}
          />

          <Button label="Skip tour" variant="quiet" size="sm" onPress={onSkip} />
        </Fade>
      </View>

      {/* Keep the caption clear of the home indicator. */}
      <View pointerEvents="none" style={{ height: insets.bottom }} />
    </View>
  );
}
