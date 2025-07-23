import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3004,
        host: '0.0.0.0',  // Allow external connections (needed for Docker)
        strictPort: true,  // Fail if port is already in use
    },
    preview: {
        port: 3004,
        host: '0.0.0.0',
    }
})