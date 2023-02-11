let plugins =
  process.env.NODE_ENV === "production"
    ? [require("autoprefixer"), require("cssnano")]
    : [require("autoprefixer")];

plugins = Object.assign(
  plugins,
  {
    'postcss-import': {},
    tailwindcss: {},
    autoprefixer: {},
  }
)
module.exports = {
  plugins
};
