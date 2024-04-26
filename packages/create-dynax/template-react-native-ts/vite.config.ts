import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const extensions = [
  '.mjs',
  '.web.tsx',
  '.tsx',
  '.web.ts',
  '.ts',
  '.web.jsx',
  '.jsx',
  '.web.js',
  '.js',
  '.css',
  '.json',
];
const development = process.env.NODE_ENV === "development";
// https://vitejs.dev/config/
export default defineConfig({
  define: {
    global: "window",
    __DEV__: JSON.stringify(development),
    DEV: JSON.stringify(development),
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
  },
  plugins: [react()],
  resolve: {
    extensions,
    alias: {
      'react-native': 'react-native-web',
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { ".js": "jsx" },
      resolveExtensions: extensions,
      jsx: "automatic",
    }
  }
})