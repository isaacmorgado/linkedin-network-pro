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
      'idle',
    ],
    host_permissions: [
      'https://www.linkedin.com/*',
      'https://*.supabase.co/*',
    ],
    action: {
      default_title: 'Uproot - Toggle Panel',
    },
    icons: {
      16: 'icon.svg',
      48: 'icon.svg',
      128: 'icon.svg',
    },
    commands: {
      'toggle-panel': {
        suggested_key: {
          default: 'Alt+Shift+P',
          mac: 'Alt+Shift+P',
          windows: 'Alt+Shift+P',
          linux: 'Alt+Shift+P',
        },
        description: 'Toggle Uproot panel (open/close)',
      },
      'save-question': {
        suggested_key: {
          default: 'Alt+Shift+S',
          mac: 'Alt+Shift+S',
          windows: 'Alt+Shift+S',
          linux: 'Alt+Shift+S',
        },
        description: 'Save highlighted text as question (job application sites only)',
      },
      'paste-to-generate': {
        suggested_key: {
          default: 'Alt+Shift+G',
          mac: 'Alt+Shift+G',
          windows: 'Alt+Shift+G',
          linux: 'Alt+Shift+G',
        },
        description: 'Paste highlighted question to Generate section (job application sites only)',
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
      target: 'es2020', // More compatible target
      minify: false, // Disable minification for better compatibility
      sourcemap: true, // Always include sourcemaps
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
