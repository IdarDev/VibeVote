module.exports = {
  content: ["./src/**/*.html", "./src/**/*.ts"],
  theme: {
    extend: {
      gridTemplateColumns: {
        8: "repeat(8, minmax(0, 1fr))",
      },
      gridColumn: {
        "span-8": "span 8 / span 8",
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
