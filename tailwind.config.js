/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        dark: "rgba(255, 255, 255, 0.0)",
        darkI: "rgba(255, 255, 255, 0.05)",
        darkII: "rgba(255, 255, 255, 0.07)",
        darkIII: "rgba(255, 255, 255, 0.09)",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
