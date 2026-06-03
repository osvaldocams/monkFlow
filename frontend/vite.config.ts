import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    tsconfigPaths(),
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server:{
    proxy:{
    // Cada vez que en tu frontend pidas algo que empiece con /api...
      '/api':{
        target: 'http://localhost:3000',// ...Vite lo redirigirá al backend
        changeOrigin: true,
      }
    }
  }
})
