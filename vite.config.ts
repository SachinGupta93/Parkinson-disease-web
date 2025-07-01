import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 3000,
    strictPort: false, // Try another port if 3000 is in use
    host: 'localhost', // Use localhost instead of :: to avoid IPv6 issues
    hmr: {
      protocol: 'ws', // Use WebSocket protocol
      host: 'localhost', // Explicitly set the host
      port: 3000, // Use the same port as the server
      clientPort: 3000, // Force client to connect to this port
      timeout: 10000, // Increase timeout to 10 seconds
    },
    fs: {
      strict: false, // Allow serving files outside of project root
      allow: ['..'], // Allow serving files from parent directory
    },
    middlewareMode: false, // Disable middleware mode to prevent some HMR issues
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom"], // Pre-bundle these deps
  },
  build: {
    sourcemap: true, // Always generate sourcemaps
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Don't try to import the entire UI directory as a module
        },
      },
    },
  },
});
