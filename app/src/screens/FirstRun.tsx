/*
The first-run sequence: survey → quote → tour → app.

Phase is derived from the server, not held only in local state, so closing the
app mid-way resumes in the right place rather than starting over or skipping
ahead. `onboardedAt` and `tourCompletedAt` are tracked separately precisely so
someone can finish the survey, skip the tour, and not be sent back through the
questions.
*/
import { useCallback, useState } from "react";
import { View } from "react-native";
import { MainTabs } from "../navigation/MainTabs";
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
    title: "Tonight's readout",
    body:
      "This is the one number that matters day to day: how many of today's doses you've logged. " +
      "Tap a dose below the ring to log it — the row itself is the button.",
  },
  {
    id: "stack-add",
    tab: "Stack",
    title: "Your stack",
    body:
      "Everything you're running lives here, with its dose, schedule and any on/off cycle. " +
      "Let's add your first one.",
    requiresAction: true,
    actionHint: "Tap Add and enter something you're taking. The tour picks up once it's saved.",
  },
  {
    id: "week-grid",
    tab: "Week",
    title: "The week at a glance",
    body:
      "One row per peptide, one column per day. Logged, missed, due and off-cycle days each " +
      "carry their own mark, so you can see a pattern forming without reading any numbers.",
  },
  {
    id: "progress-checkin",
    tab: "Progress",
    title: "Check in on yourself",
    body:
      "Log weight, energy and mood, with photos if you want them. The chart builds a trend " +
      "over time, which is what tells you whether any of this is doing anything.",
  },
  {
    id: "fuel-builder",
    tab: "Fuel",
    title: "What you eat matters here",
    body:
      "Diet does a lot of the work alongside peptides and GLP-1s — this screen sets calorie and " +
      "macro targets from your profile, flags the nutrients your goals lean on, and can build a " +
      "meal that fits them.",
  },
];

type Phase = "survey" | "quote" | "tour";

export function FirstRun() {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useUpdateProfile();

  // Someone who already answered the survey but bailed on the tour resumes
  // at the tour, not back at the questions.
  const [phase, setPhase] = useState<Phase>(user?.onboardedAt ? "tour" : "survey");

  const goToTab = useCallback((tab: TourStop["tab"]) => {
    navigateToTab(tab);
  }, []);

  const finishTour = useCallback(() => {
    // Fire and forget: a failed write means they see the tour once more, which
    // is a far better failure than blocking entry to the app.
    updateProfile.mutate({ tourCompleted: true });
  }, [updateProfile]);

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
