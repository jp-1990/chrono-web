// tailwind.config.js
const FormKitVariants = require('@formkit/themes/tailwindcss');
module.exports = {
  content: [
    './src/**/*.{html,js,ts,vue}',
    './node_modules/@formkit/themes/dist/tailwindcss/genesis/index.cjs'
  ],
  plugins: [FormKitVariants],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fade-in 0.2s'
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: 0, filter: 'grayscale(100%) contrast(0)' },
          '100%': { opacity: 1, filter: 'grayscale(0%) contrast(1)' }
        }
      }
    }
  }
};
