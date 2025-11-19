import { defineConfig } from 'wxt';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  srcDir: 'src',
  outDir: '.output',

  manifest: {
    name: 'Uproot',
    description: 'AI-powered LinkedIn networking and job application assistant',
    version: '1.0.0',
    permissions: [
      'storage',
      'alarms',
      'notifications',
      'identity',
      'activeTab',
      'scripting',
    ],
    host_permissions: [
      'https://www.linkedin.com/*',
      'https://*.supabase.co/*',
    ],
    action: {
      default_title: 'Uproot - Toggle Panel',
    },
    content_security_policy: {
      extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'",
    },
  },

  vite: () => ({
    plugins: [
      react(),
      tailwindcss(),
    ],
    build: {
      target: 'esnext',
      minify: 'esbuild',
      sourcemap: process.env.NODE_ENV === 'development',
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  }),

  runner: {
    disabled: false,
    chromiumArgs: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process',
    ],
  },
});
