module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html",
    "./src/components/GoalMasterChat/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {},
  },
  safelist: [
    'text-blue-600',
    'dark:text-blue-400',
    'text-purple-600',
    'dark:text-purple-400',
  ],
  plugins: [],
};
