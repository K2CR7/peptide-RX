import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ReactElement } from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckinScreen } from "../screens/CheckinScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { NutritionScreen } from "../screens/NutritionScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { StackScreen } from "../screens/StackScreen";
import { FuelIcon, RingIcon, TrendIcon, VialIcon, WeekIcon } from "../components/icons";
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

export function MainTabs() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.signalInk,
        tabBarInactiveTintColor: colors.ink2,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          height: 60 + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
        },
        tabBarLabelStyle: {
          fontFamily: font.semibold,
          fontSize: 11,
          lineHeight: 14,
          letterSpacing: 0.5,
          textTransform: "uppercase",
          marginTop: 1,
        },
        /*
          The active tab carries a drawn rule, not just a tint.

          signalInk against ink2 measures 1.27:1 — the two tints are very
          nearly the same value, so with identical icons and identical labels
          the selected tab was effectively unmarked. That is the one piece of
          chrome in the app that must never be ambiguous, since it is the only
          navigation there is.

          The rule occupies its space whether or not it is drawn, so switching
          tabs moves no pixels.
        */
        tabBarIcon: ({ color, focused }) => (
          <View style={{ alignItems: "center" }}>
            <View
              style={{
                height: 2,
                width: 18,
                borderRadius: radii.hair,
                marginBottom: 5,
                backgroundColor: focused ? colors.signalInk : "transparent",
              }}
            />
            {ICONS[route.name]({ color })}
          </View>
        ),
      })}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Week" component={ScheduleScreen} />
      <Tab.Screen name="Stack" component={StackScreen} />
      <Tab.Screen name="Progress" component={CheckinScreen} />
      <Tab.Screen name="Fuel" component={NutritionScreen} />
    </Tab.Navigator>
  );
}
