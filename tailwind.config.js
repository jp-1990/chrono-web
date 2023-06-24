// tailwind.config.js
const FormKitVariants = require('@formkit/themes/tailwindcss');
module.exports = {
  content: [
    './src/**/*.{html,js,ts,vue}',
    './node_modules/@formkit/themes/dist/tailwindcss/genesis/index.cjs'
  ],
  plugins: [FormKitVariants]
};
