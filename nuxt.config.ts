// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  typescript: {
    strict: true,
    shim: false
  },
  modules: ['@nuxtjs/tailwindcss', '@formkit/nuxt'],
  build: {
    transpile: ['@vuepic/vue-datepicker']
  }
});
