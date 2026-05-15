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
        port: 3000,
        strictPort: true,
        proxy: {
            '/api': {
                target: 'https://admin.aiot-shtplabs.com',
                changeOrigin: true,
                secure: false,
            },
        }
    },
    preview: {
        host: '0.0.0.0',
        port: 3000,
        strictPort: true,
        cors: true,
        allowedHosts: ['aiot-shtplabs.com', 'www.aiot-shtplabs.com'],
        headers: {
            'Cache-Control': 'max-age=31536000',
        }
    }
}) 