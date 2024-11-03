// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    strict: true,
    shim: false
  },

  modules: ['@nuxtjs/tailwindcss', '@formkit/nuxt', 'nuxt-vue3-google-signin'],

  build: {
    transpile: ['@vuepic/vue-datepicker']
  },

  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID
  },

  compatibilityDate: '2024-11-03'
});