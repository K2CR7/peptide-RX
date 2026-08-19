import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text } from "react-native";
import { CheckinScreen } from "../screens/CheckinScreen";
import { HomeScreen } from "../screens/HomeScreen";
import { LearnScreen } from "../screens/LearnScreen";
import { NutritionScreen } from "../screens/NutritionScreen";
import { ScheduleScreen } from "../screens/ScheduleScreen";
import { StackScreen } from "../screens/StackScreen";
import { colors } from "../theme";

const Tab = createBottomTabNavigator();

const ICONS: Record<string, string> = {
  Home: "🏠",
  Schedule: "📅",
  Stack: "💉",
  Progress: "📈",
  Nutrition: "🥗",
  Learn: "📖",
};

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.teal,
        tabBarInactiveTintColor: colors.ink3,
        tabBarIcon: () => <Text style={{ fontSize: 18 }}>{ICONS[route.name]}</Text>,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Schedule" component={ScheduleScreen} />
      <Tab.Screen name="Stack" component={StackScreen} />
      <Tab.Screen name="Progress" component={CheckinScreen} />
      <Tab.Screen name="Nutrition" component={NutritionScreen} />
      <Tab.Screen name="Learn" component={LearnScreen} />
    </Tab.Navigator>
  );
}
