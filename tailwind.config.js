const Color = require("color");

module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: generateColors("#B280E3"),
        bone: generateColors("#F9F9F9"),
      },
    },
  },
  plugins: [],
};

function generateColors(code) {
  const color = Color(code);
  const toLigten = [400, 300, 200, 100, 50];
  const toDarken = [600, 700, 800, 900];
  const output = { 500: color.hex() };

  toLigten.forEach((val, index) => {
    output[val] = color.lighten(0.1 * (index + 1)).hex();
  });

  toDarken.forEach((val, index) => {
    output[val] = color.darken(0.1 * (index + 1)).hex();
  });

  return output;
}
