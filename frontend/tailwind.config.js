/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        mono: ["var(--font-dm-mono)", "monospace"],
        editorial: ["var(--font-instrument-serif)", "serif"],
      },
      colors: {
        "surface-base": "var(--surface-base)",
        "surface-raised": "var(--surface-raised)",
        "surface-overlay": "var(--surface-overlay)",
        "border-c": "var(--border-c)",
        "border-subtle": "var(--border-subtle)",
        accent: "var(--accent)",
        "accent-dim": "var(--accent-dim)",
        "accent-subtle": "var(--accent-subtle)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-faint": "var(--text-faint)",
        positive: "var(--positive)",
        negative: "var(--negative)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease forwards",
        "slide-up": "slideUp 300ms ease forwards",
        "slide-down": "slideDown 250ms ease forwards",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
