/*
The first-run sequence: intro → survey → quote → tour → app.

The intro came later than the rest and fixed something embarrassing: the app
opened on a form. The very first thing anyone saw was a question about their
date of birth, asked by a product that had not yet said a word about what it
was for or what it would do with the answer.

Phase is derived from the server, not held only in local state, so closing the
app mid-way resumes in the right place rather than starting over or skipping
ahead. `onboardedAt` and `tourCompletedAt` are tracked separately precisely so
someone can finish the survey, skip the tour, and not be sent back through the
questions.
*/
import { useCallback, useState } from "react";
import { View } from "react-native";
import { MainTabs } from "../navigation/MainTabs";
import { IntroScreen } from "./IntroScreen";
import { OnboardingScreen } from "./OnboardingScreen";
import { QuoteScreen } from "./QuoteScreen";
import { TourProvider, type TourStop } from "../components/tour";
import { useUpdateProfile } from "../lib/queries";
import { useAuthStore } from "../store/authStore";
import { navigateToTab } from "../navigation/navRef";
import { Fade } from "../components/motion";
import { colors } from "../theme";

/**
 * The tour. Each stop names a real control rather than describing the screen
 * in the abstract, because the thing being taught is where to tap.
 */
const STOPS: TourStop[] = [
  {
    id: "today-ring",
    tab: "Today",
    title: "Today",
    body:
      "The ring is today's doses, logged against due. Tap a dose below it to log one.",
  },
  {
    id: "stack-add",
    tab: "Stack",
    title: "Stack",
    body:
      "Everything you're running, with its dose, schedule and any on/off cycle.",
    requiresAction: true,
    actionHint: "Tap Add and enter something you're taking.",
  },
  {
    id: "week-grid",
    tab: "Week",
    title: "Week",
    body:
      "One row per peptide, one column per day. Logged, missed, due and off-cycle each carry their own mark.",
  },
  {
    id: "progress-checkin",
    tab: "Progress",
    title: "Progress",
    body:
      "Weight, energy and mood, with photos if you want them. The chart builds the trend.",
  },
  {
    id: "fuel-builder",
    tab: "Fuel",
    title: "Fuel",
    body:
      "Calorie and macro targets from your profile, the nutrients your goals lean on, and a " +
      "meal builder that works to them.",
  },
];

type Phase = "intro" | "survey" | "quote" | "tour";

export function FirstRun() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  // Someone who already answered the survey but bailed on the tour resumes
  // at the tour, not back at the questions.
  const [phase, setPhase] = useState<Phase>(user?.onboardedAt ? "tour" : "intro");

  const goToTab = useCallback((tab: TourStop["tab"]) => {
    navigateToTab(tab);
  }, []);

  const finishTour = useCallback(() => {
    // Fire and forget: a failed write means they see the tour once more, which
    // is a far better failure than blocking entry to the app.
    updateProfile.mutate({ tourCompleted: true });
  }, [updateProfile]);

  if (phase === "intro") {
    return (
      <Fade style={{ flex: 1 }}>
        <IntroScreen onDone={() => setPhase("survey")} />
      </Fade>
    );
  }

  if (phase === "survey") {
    return (
      <Fade style={{ flex: 1 }}>
        <OnboardingScreen onDone={() => setPhase("quote")} />
      </Fade>
    );
  }

  if (phase === "quote") {
    return (
      <Fade style={{ flex: 1 }}>
        <QuoteScreen onContinue={() => setPhase("tour")} />
      </Fade>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <TourProvider stops={STOPS} onFinish={finishTour} onTabChange={goToTab}>
        <MainTabs />
      </TourProvider>
    </View>
  );
}
