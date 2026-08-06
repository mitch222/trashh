import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    define: {
      'process.env': env,
    },
    plugins: [react()],
    base: '/',
    build: {
      outDir: 'dist',
    },
    server: {
      proxy: {
        '/api': {
          // Production by default, so `npm run dev` shows real data with no
          // setup. Override with VITE_DEV_API_PROXY (e.g. http://localhost:3001
          // running `vercel dev`) to develop against a local API — without it,
          // backend changes are invisible in dev because every /api/* call is
          // forwarded to the deployed version instead.
          target: env.VITE_DEV_API_PROXY || 'https://trashh.vercel.app',
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
