"use client";

import { Moon, Sun } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { THEME_STORAGE_KEY } from "@/lib/inline-scripts";

/** Switches between the default dark theme and the light theme, and remembers the choice. */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    // Dark is the default look; light is the alternative.
    const next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    root.setAttribute("data-theme", next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Private mode or blocked storage: the theme still changes for this visit.
    }
  }

  // Both icons are rendered and CSS shows the right one, so the button never
  // depends on client-only state and cannot mismatch during hydration.
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Switch between light and dark theme"
      className={buttonStyles({ variant: "ghost", size: "icon" })}
    >
      <Sun className="light:hidden" aria-hidden />
      <Moon className="hidden light:block" aria-hidden />
    </button>
  );
}
