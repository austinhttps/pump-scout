import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import {publicApi} from './server/dev-plugin.js'
export default defineConfig({plugins:[react(),tailwindcss(),publicApi()],build:{rollupOptions:{output:{manualChunks:{maps:['leaflet']}}}}})
