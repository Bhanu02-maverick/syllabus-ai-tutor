/** @type {import('tailwindcss').Config} */

// Colours resolve to CSS variables defined in src/styles/tokens.css, so a
// single data-theme switch on <html> re-themes every component.
const token = (name) => `rgb(var(--color-${name}) / <alpha-value>)`;

const brandScale = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950].map((step) => [step, token(`brand-${step}`)])
);

export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  // `dark:` utilities follow the in-app theme toggle, not the OS setting.
  darkMode: ["selector", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        brand: brandScale,
        // Existing indigo/blue utilities follow the brand scale, so the
        // accent colour can be changed in one place.
        indigo: brandScale,
        blue: brandScale,

        canvas: token("canvas"),
        surface: {
          DEFAULT: token("surface"),
          sunken: token("surface-sunken"),
        },
        field: token("field"),
        line: {
          DEFAULT: token("line"),
          strong: token("line-strong"),
        },
        ink: {
          DEFAULT: token("ink"),
          soft: token("ink-soft"),
          muted: token("ink-muted"),
          subtle: token("ink-subtle"),
        },
        primary: {
          DEFAULT: token("primary"),
          hover: token("primary-hover"),
          ink: token("primary-ink"),
          soft: token("primary-soft"),
          on: token("on-primary"),
        },
        success: { DEFAULT: token("success"), soft: token("success-soft") },
        warning: { DEFAULT: token("warning"), soft: token("warning-soft") },
        danger: { DEFAULT: token("danger"), soft: token("danger-soft") },
        insight: { DEFAULT: token("insight"), soft: token("insight-soft") },
      },
      fontFamily: {
        sans: "var(--font-sans)",
        display: "var(--font-display)",
        mono: "var(--font-mono)",
      },
      spacing: {
        gutter: "var(--space-gutter)",
        card: "var(--space-card)",
        section: "var(--space-section)",
      },
      borderRadius: {
        sm: "var(--radius-xs)",
        md: "var(--radius-sm)",
        lg: "var(--radius-md)",
        xl: "var(--radius-lg)",
        "2xl": "var(--radius-xl)",
        "3xl": "var(--radius-2xl)",
        pill: "var(--radius-pill)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        raised: "var(--shadow-raised)",
        focus: "var(--ring-focus)",
      },
    },
  },
  plugins: [],
};
