/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ts,tsx}", // adjust if needed
  ],
  theme: {
    extend: {
      colors: {
        esther: 'rgb(var(--color-esther) / <alpha-value>)',
        maximus: 'rgb(var(--color-maximus) / <alpha-value>)',
        linx: 'rgb(var(--color-linx) / <alpha-value>)',
      },
      fontFamily: {
        cartoon: ['"Lilita One"', 'cursive'],
      },
    },
  },
  plugins: [],
};
