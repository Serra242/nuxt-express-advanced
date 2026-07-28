export default defineNuxtConfig({
  srcDir: 'src/',
  runtimeConfig: {
    public: {
      apiBase: 
      process.env.NUXT_PUBLIC_API_BASE || 
      'http://localhost:3001',
    },
  },
})
