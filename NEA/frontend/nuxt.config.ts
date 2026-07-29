export default defineNuxtConfig({
  srcDir: 'src/',

  css: ['~/assets/scss/main.scss'],

  components: [
    {
      path: '~/components',
      pathPrefix: false,
    },
  ],

  runtimeConfig: {
    public: {
      apiBase:
        process.env.NUXT_PUBLIC_API_BASE ||
        'http://localhost:3001/api',
    },
  },
})