/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  // Required on web: Expo applies userInterfaceStyle ("light") via setColorScheme,
  // which NativeWind only allows when dark mode is class-based.
  darkMode: "class",
  theme: {
    extend: {},
  },
  plugins: [],
};
