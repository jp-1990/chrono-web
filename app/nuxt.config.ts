const appName = 'Chrono';
const shortAppName = 'Chrono';
const appDescription = 'Track your time by recording activities';
const themeColor = '#1E293B';

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  imports: {
    autoImport: false
  },
  vite: {
    build: {
      target: 'esnext'
    }
  },
  typescript: {
    strict: true,
    shim: false
  },
  modules: [
    '@nuxtjs/tailwindcss',
    '@formkit/nuxt',
    'nuxt-vue3-google-signin',
    '@nuxt/fonts',
    '@vite-pwa/nuxt',
    '@nuxt/test-utils/module'
  ],
  pwa: {
    scope: '/',
    base: '/',
    injectRegister: 'auto',
    registerType: 'autoUpdate',
    manifest: {
      name: appName,
      short_name: shortAppName,
      description: appDescription,
      theme_color: themeColor,
      background_color: themeColor,
      icons: [
        {
          src: 'pwa-64x64.png',
          sizes: '64x64',
          type: 'image/png'
        },
        {
          src: 'pwa-192x192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'pwa-512x512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'maskable-icon-512x512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    registerWebManifestInRouteRules: true,
    workbox: {
      navigateFallback: undefined,
      cleanupOutdatedCaches: true,
      // globPatterns: [
      //   "**/*.{json,ico,svg,ttf,woff,css,scss,js,html,txt,jpg,png,woff2,mjs,otf,ani}",
      // ],
      runtimeCaching: [
        {
          urlPattern: '/',
          handler: 'NetworkFirst'
        },
        {
          urlPattern: /^https:\/\/api\.com\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'defualt-cache',
            cacheableResponse: {
              statuses: [0, 200]
            }
          }
        }
      ]
    },
    client: {
      installPrompt: false,
      periodicSyncForUpdates: 20 //seconds
    },
    devOptions: {
      enabled: true,
      suppressWarnings: false,
      navigateFallback: 'index.html',
      type: 'module'
    }
  },
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

  compatibilityDate: '2024-12-10'
});
