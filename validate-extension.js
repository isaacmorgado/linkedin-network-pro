#!/usr/bin/env node

import { readFile, access } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const extensionDir = join(__dirname, '.output/chrome-mv3');

async function validateExtension() {
  console.log('🔍 Validating Chrome extension...\n');

  let hasErrors = false;

  try {
    // Read manifest
    const manifestPath = join(extensionDir, 'manifest.json');
    const manifestContent = await readFile(manifestPath, 'utf8');
    const manifest = JSON.parse(manifestContent);

    console.log(`✓ Manifest loaded: ${manifest.name} v${manifest.version}`);

    // Check service worker
    if (manifest.background?.service_worker) {
      const swPath = join(extensionDir, manifest.background.service_worker);
      try {
        await access(swPath);
        console.log(`✓ Service worker exists: ${manifest.background.service_worker}`);
      } catch (err) {
        console.error(`✗ Service worker not found: ${manifest.background.service_worker}`);
        hasErrors = true;
      }
    }

    // Check icons
    if (manifest.icons) {
      for (const [size, iconPath] of Object.entries(manifest.icons)) {
        const fullPath = join(extensionDir, iconPath);
        try {
          await access(fullPath);
          console.log(`✓ Icon ${size}px exists: ${iconPath}`);
        } catch (err) {
          console.error(`✗ Icon ${size}px not found: ${iconPath}`);
          hasErrors = true;
        }
      }
    }

    // Check content scripts
    if (manifest.content_scripts) {
      for (const cs of manifest.content_scripts) {
        if (cs.js) {
          for (const jsFile of cs.js) {
            const fullPath = join(extensionDir, jsFile);
            try {
              await access(fullPath);
              console.log(`✓ Content script exists: ${jsFile}`);
            } catch (err) {
              console.error(`✗ Content script not found: ${jsFile}`);
              hasErrors = true;
            }
          }
        }
        if (cs.css) {
          for (const cssFile of cs.css) {
            const fullPath = join(extensionDir, cssFile);
            try {
              await access(fullPath);
              console.log(`✓ Content stylesheet exists: ${cssFile}`);
            } catch (err) {
              console.error(`✗ Content stylesheet not found: ${cssFile}`);
              hasErrors = true;
            }
          }
        }
      }
    }

    console.log();
    if (hasErrors) {
      console.log('❌ Extension validation FAILED - fix the errors above');
      process.exit(1);
    } else {
      console.log('✅ Extension validation PASSED - all files present');
      console.log(`\n📂 Extension location: ${extensionDir}`);
      console.log('📝 You can now load this extension in Chrome via chrome://extensions/');
      process.exit(0);
    }

  } catch (err) {
    console.error('❌ Validation error:', err.message);
    process.exit(1);
  }
}

validateExtension();
