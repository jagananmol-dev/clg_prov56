/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        // Explicit rather than relying on the body-element cascade in
        // index.css — makes the intended font self-evident wherever
        // `font-sans` is used, and keeps it correct even if that
        // component is ever rendered outside <body>'s default styling.
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
