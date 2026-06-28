import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm rose-nude palette — soft, editorial, not bubblegum
        blush: {
          50: "#fdf4f4",
          100: "#fce8e8",
          200: "#f8d0d0",
          300: "#f2a8a8",
          400: "#e87575",
          500: "#d94f4f",
          600: "#c13333",
          700: "#a12727",
          800: "#862424",
          900: "#712323",
        },
        nude: {
          50: "#faf7f5",
          100: "#f3ece7",
          200: "#e8d9cf",
          300: "#d7bfb0",
          400: "#c29d8a",
          500: "#b0826d",
          600: "#9a6d5a",
          700: "#80594a",
          800: "#694b40",
          900: "#573f37",
        },
        champagne: {
          50: "#fdfbf5",
          100: "#faf5e8",
          200: "#f4e9cb",
          300: "#ebd6a1",
          400: "#dfc070",
          500: "#d4a843",
          600: "#be8f2e",
          700: "#9e7226",
          800: "#815c24",
          900: "#6b4d21",
        },
      },
      fontFamily: {
        display: ["Georgia", "Cambria", "serif"],
        body: ["system-ui", "-apple-system", "sans-serif"],
      },
      backgroundImage: {
        "gradient-warm": "linear-gradient(135deg, #fdf4f4 0%, #faf7f5 50%, #fdfbf5 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
