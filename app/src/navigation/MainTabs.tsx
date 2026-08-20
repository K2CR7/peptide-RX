import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { ReactElement } from "react";
import { CheckinScreen } from "../screens/CheckinScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LearnScreen } from "../screens/LearnScreen";
import { NutritionScreen } from "../screens/NutritionScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { StackScreen } from "../screens/StackScreen";
import { BookIcon, FuelIcon, RingIcon, TrendIcon, VialIcon, WeekIcon } from "../components/icons";
import { colors, font } from "../theme";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, (props: { color: string }) => ReactElement> = {
  Today: ({ color }) => <RingIcon color={color} />,
  Week: ({ color }) => <WeekIcon color={color} />,
  Stack: ({ color }) => <VialIcon color={color} />,
  Progress: ({ color }) => <TrendIcon color={color} />,
  Fuel: ({ color }) => <FuelIcon color={color} />,
  Learn: ({ color }) => <BookIcon color={color} />,
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.signal,
        tabBarInactiveTintColor: colors.ink3,
        tabBarStyle: {
          backgroundColor: colors.panel,
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
          height: 62,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontFamily: font.semibold,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: "uppercase",
        },
        tabBarIcon: ({ color }) => ICONS[route.name]({ color }),
      })}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Week" component={ScheduleScreen} />
      <Tab.Screen name="Stack" component={StackScreen} />
      <Tab.Screen name="Progress" component={CheckinScreen} />
      <Tab.Screen name="Fuel" component={NutritionScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
    </Tab.Navigator>
  );
}
