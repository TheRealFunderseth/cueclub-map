/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // Ensure Tailwind scans all the necessary files in the app directory.
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
