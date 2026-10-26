import { Redirect, useLocalSearchParams, type Href } from "expo-router";
import { useOnboarding } from "../../../onboarding/OnboardingProvider";
import { STEP_SCREENS } from "../../../onboarding/stepScreens";
import { isStepId } from "../../../onboarding/steps";

// One route for every question: /step/gender, /step/name, /step/birthday…
export default function OnboardingStepRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { loaded } = useOnboarding();

  if (!isStepId(id)) {
    if (__DEV__) console.log(`[onboarding] unknown step "${id}" → start`);
    return <Redirect href={"/start" as Href} />;
  }
  if (!loaded) return null; // saved answers are still loading (a few ms)

  const StepScreen = STEP_SCREENS[id];
  return <StepScreen />;
}
