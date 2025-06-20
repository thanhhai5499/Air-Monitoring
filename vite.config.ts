import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                icon: true,
                // This will transform your SVG to a React component
            },
        }),
    ],
    server: {
        host: '0.0.0.0',
        port: 3001,
        strictPort: true,
    },
    preview: {
        host: '0.0.0.0',
        port: 3001,
        strictPort: true,
        cors: true,
        allowedHosts: ['admin.aiot-shtplabs.com'],
        headers: {
            'Cache-Control': 'max-age=31536000',
        }
    }
}) 