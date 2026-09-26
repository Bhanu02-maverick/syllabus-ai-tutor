import { useEffect } from "react";

// Mirrors a page's dark/light toggle onto <html data-theme>, which switches
// the CSS variables in src/styles/tokens.css.
export function useThemeAttribute(isDark) {
  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? "dark" : "light";
  }, [isDark]);
}
