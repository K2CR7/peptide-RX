/*
The tab bar, and the transition between tabs.

Two animations, both deliberately small.

The scenes cross-fade over 180ms. A slide would imply the five sections sit
in a row and that swiping moves along it, which is not true here — these are
five views of the same day, not pages in a document. A fade says "the frame
changed" without asserting a direction, and at 180ms it reads as the screen
responding rather than as a transition playing. There is also a 0.6% scale on
the outgoing scene, which is under the threshold of being seen as movement
but is the difference between a cut and a dissolve.

The active rule slides rather than blinking from one tab to the next. It is
the only navigational state in the app, so the one thing worth animating is
the thing that tells you where you are: the eye follows the rule across and
arrives already knowing which tab is selected. That is why this is a custom
tab bar — the default one can only re-render each item independently, so the
rule can only disappear here and reappear there, and a jump is exactly the
part that carries no information.

Both degrade to zero duration under reduced motion, which leaves the end
state untouched: the rule is still in the right place, the scene is still
opaque.
*/
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckinScreen } from "../screens/CheckinScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NutritionScreen } from "../screens/NutritionScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { StackScreen } from "../screens/StackScreen";
import { FuelIcon, RingIcon, TrendIcon, VialIcon, WeekIcon } from "../components/icons";
import { Animated, DUR, EASE, dur, useReduceMotion } from "../components/motion";
import { colors, font, radii } from "../theme";

const Tab = createBottomTabNavigator();

// Five top-level sections is the iOS ceiling. Peptide reference is not a daily
// destination, so it lives behind a control on Stack rather than taking a tab.
const ICONS: Record<string, (props: { color: string }) => ReactElement> = {
  Today: ({ color }) => <RingIcon size={21} color={color} />,
  Week: ({ color }) => <WeekIcon size={21} color={color} />,
  Stack: ({ color }) => <VialIcon size={21} color={color} />,
  Progress: ({ color }) => <TrendIcon size={21} color={color} />,
  Fuel: ({ color }) => <FuelIcon size={21} color={color} />,
};

/** Constant. Animating width as well as position is two readings, not one. */
const RULE_W = 18;
const RULE_H = 2;
const RULE_TOP = 6;

function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const reduced = useReduceMotion();

  /*
    Measured centres, kept in a ref rather than in state.

    Writing each tab's layout straight into state would be five renders
    during the first paint, and every one of them a full re-render of the bar.
    The ref is filled by onLayout and a single boolean flips once the last tab
    has reported, which is the only render that actually needs to happen.
  */
  const centres = useRef<number[]>([]);
  const [measured, setMeasured] = useState(false);

  const pos = useRef(new Animated.Value(state.index)).current;

  useEffect(() => {
    // Not reset to zero first: the rule travels from the previously selected
    // tab, which is the entire point of animating it.
    const anim = Animated.timing(pos, {
      toValue: state.index,
      duration: dur(DUR.move, reduced),
      easing: EASE,
      useNativeDriver: true,
    });
    anim.start();
    return () => {
      anim.stop();
      // The rule must end up under the tab that is actually selected.
      pos.setValue(state.index);
    };
  }, [pos, reduced, state.index]);

  const count = state.routes.length;

  /*
    Until every tab has been measured there is nothing honest to draw, so the
    rule is simply absent for that first frame. A rule placed at a guessed
    position and then corrected is worse than a rule that arrives a frame late.
  */
  const ruleX =
    measured && count > 1
      ? pos.interpolate({
          inputRange: state.routes.map((_, i) => i),
          outputRange: centres.current.map((c) => c - RULE_W / 2),
          extrapolate: "clamp",
        })
      : null;

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.panel,
        borderTopWidth: 1,
        borderTopColor: colors.hairline,
        height: 60 + insets.bottom,
        paddingTop: RULE_TOP,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
      }}
    >
      {ruleX !== null && (
        <Animated.View
          // The rule is decoration for a state the label and icon already
          // carry, so it is not announced.
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={{
            position: "absolute",
            top: RULE_TOP,
            left: 0,
            width: RULE_W,
            height: RULE_H,
            borderRadius: radii.hair,
            backgroundColor: colors.signalInk,
            transform: [{ translateX: ruleX }],
          }}
        />
      )}

      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const focused = state.index === index;
        const color = focused ? colors.signalInk : colors.ink2;

        return (
          <Pressable
            key={route.key}
            accessibilityRole="button"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={options.tabBarAccessibilityLabel ?? route.name}
            testID={options.tabBarButtonTestID}
            onLayout={(e) => {
              const { x, width } = e.nativeEvent.layout;
              centres.current[index] = x + width / 2;
              if (!measured && centres.current.filter((v) => v !== undefined).length === count) {
                setMeasured(true);
              }
            }}
            onPress={() => {
              /*
                The navigator's own contract, not a shortcut around it. The
                event is what lets a screen intercept a press on its own tab —
                scroll-to-top, for instance — and `defaultPrevented` is how it
                says it handled it.
              */
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            onLongPress={() => {
              navigation.emit({ type: "tabLongPress", target: route.key });
            }}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-start",
              // The icons are drawn, so a focus ring is the only thing that
              // marks keyboard position on web.
              ...(Platform.OS === "web" ? { outlineOffset: 2 } : null),
            }}
          >
            {/* Holds the rule's space so the icons don't sit a frame higher. */}
            <View style={{ height: RULE_H, marginBottom: 5 }} />
            {ICONS[route.name]({ color })}
            <Text
              numberOfLines={1}
              style={{
                fontFamily: font.semibold,
                fontSize: 11,
                lineHeight: 14,
                letterSpacing: 0.5,
                textTransform: "uppercase",
                marginTop: 1,
                color,
              }}
            >
              {route.name}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function MainTabs() {
  const reduced = useReduceMotion();

  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
        animation: "fade",
        transitionSpec: {
          animation: "timing",
          config: { duration: dur(DUR.move, reduced), easing: EASE },
        },
        /*
          `current.progress` runs -1 to 1: negative while this scene is the
          one being left, positive while it is the one being entered. Zero is
          settled, and zero must be fully opaque and unscaled — the resting
          state of every scene has to be the untouched one.
        */
        sceneStyleInterpolator: ({ current }) => ({
          sceneStyle: {
            opacity: current.progress.interpolate({
              inputRange: [-1, 0, 1],
              outputRange: [0, 1, 0],
              extrapolate: "clamp",
            }),
            transform: [
              {
                scale: current.progress.interpolate({
                  inputRange: [-1, 0, 1],
                  outputRange: reduced ? [1, 1, 1] : [0.994, 1, 0.994],
                  extrapolate: "clamp",
                }),
              },
            ],
          },
        }),
      }}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Week" component={ScheduleScreen} />
      <Tab.Screen name="Stack" component={StackScreen} />
      <Tab.Screen name="Progress" component={CheckinScreen} />
      <Tab.Screen name="Fuel" component={NutritionScreen} />
    </Tab.Navigator>
  );
}
