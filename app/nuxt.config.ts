// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    strict: true,
    shim: false
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@formkit/nuxt',
    'nuxt-vue3-google-signin',
    '@nuxt/fonts'
  ],

  build: {
    transpile: ['@vuepic/vue-datepicker']
  },

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },

  fonts: {
    defaults: {
      weights: [300, 400, 500, 600, 700]
    }
  },

  compatibilityDate: '2024-11-03'
});
