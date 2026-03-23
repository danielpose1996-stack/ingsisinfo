import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@supabase')) return 'supabase-vendor';
            if (id.includes('@tiptap')) return 'editor-vendor';
            if (id.includes('framer-motion')) return 'framer-vendor';
            if (id.includes('lucide-react') || id.includes('clsx') || id.includes('tailwind-merge')) return 'ui-vendor';
            if (id.includes('@dnd-kit')) return 'dnd-vendor';
            return 'vendor';
          }
        }
      }
    }
  }
})
