import { createContext, useContext } from "react";

/**
 * Only the toggle travels through context — the palette itself lives in module
 * bindings in theme.ts (see the note there), so this stays a one-value context
 * rather than a provider every component has to read.
 */
export const ThemeToggleContext = createContext<() => void>(() => {});

export function useThemeToggle(): () => void {
  return useContext(ThemeToggleContext);
}
