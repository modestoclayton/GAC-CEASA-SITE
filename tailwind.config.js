/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./styles/**/*.{css,scss,js}" // Ajustado para ler a pasta styles
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
