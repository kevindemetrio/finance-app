import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          green: "#1D9E75",
          "green-light": "#E1F5EE",
          "green-dark": "#0F6E56",
          red: "#E24B4A",
          "red-light": "#FCEBEB",
          "red-dark": "#A32D2D",
          amber: "#BA7517",
          "amber-light": "#FAEEDA",
          "amber-dark": "#854F0B",
          blue: "#378ADD",
          "blue-light": "#E6F1FB",
          "blue-dark": "#185FA5",
          orange: "#D85A30",
        },
      },
    },
  },
  plugins: [],
};
export default config;
