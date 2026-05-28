module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}", "./index.html"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "hsl(210, 70%, 50%)",
        secondary: "hsl(260, 60%, 55%)",
        accent: "hsl(45, 100%, 65%)",
        background: "hsl(210, 10%, 10%)",
        surface: "hsl(210, 15%, 15%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
