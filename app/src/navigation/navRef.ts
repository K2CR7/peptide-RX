import { createNavigationContainerRef } from "@react-navigation/native";

/**
 * A ref to the navigation container, so code outside a screen can move tabs.
 *
 * The tour needs this: it drives the app to the right tab before each stop,
 * and it lives above the tab navigator rather than inside any one screen, so
 * `useNavigation` isn't available to it.
 */
export const navRef = createNavigationContainerRef();

export function navigateToTab(name: string) {
  if (navRef.isReady()) {
    // @ts-expect-error — tab names are plain strings here; the navigator is
    // untyped, and adding a full param list for five static tabs buys nothing.
    navRef.navigate(name);
  }
}
