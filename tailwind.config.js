/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#121212",
        darkI: "rgba(18, 18, 18, 0.95)",
        darkII: "rgba(18, 18, 18, 0.93)",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
