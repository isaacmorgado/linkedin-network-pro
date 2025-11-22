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
    commands: {
      'toggle-panel': {
        suggested_key: {
          default: 'Alt+1',
          mac: 'Alt+1',
          windows: 'Alt+1',
          linux: 'Alt+1',
        },
        description: 'Toggle Uproot panel (open/close)',
      },
      'save-question': {
        suggested_key: {
          default: 'Alt+2',
          mac: 'Alt+2',
          windows: 'Alt+2',
          linux: 'Alt+2',
        },
        description: 'Save highlighted text as question',
      },
      'paste-to-generate': {
        suggested_key: {
          default: 'Alt+3',
          mac: 'Alt+3',
          windows: 'Alt+3',
          linux: 'Alt+3',
        },
        description: 'Paste highlighted question to Generate section',
      },
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
      rollupOptions: {
        external: ['jspdf', 'docx'],
      },
    },
    resolve: {
      alias: {
        '@': '/src',
      },
    },
    optimizeDeps: {
      include: ['jspdf', 'docx'],
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
