import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Palette principale : Blanc, Noir, Vert foncé (Sherbrooke SaaS)
        brand: {
          50: "#ECFDF5",
          100: "#D1FAE5",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B", // Vert foncé principal
          950: "#022C22",
        },
        background: "#FFFFFF",
        foreground: "#09090B",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#09090B",
        },
        muted: {
          DEFAULT: "#F4F4F5",
          foreground: "#52525B",
        },
        border: "#E4E4E7",
        input: "#E4E4E7",
        ring: "#064E3B",
      },
      borderRadius: {
        lg: "0.75rem",
        md: "0.5rem",
        sm: "0.375rem",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
