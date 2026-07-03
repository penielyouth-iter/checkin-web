import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    base: '/checkin-web/',
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    firebase: ['firebase/app', 'firebase/database'],
                    vendor: ['react', 'react-dom', 'react-router-dom'],
                    dndkit: ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
                },
            },
        },
    },
    server: {
        port: 3000,
        open: true,
    },
});
