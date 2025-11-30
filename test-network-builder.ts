/**
 * Network Builder Test Script
 * Run this in the browser console on a LinkedIn profile page to debug
 */

// Test 1: Check if content script is loaded
console.log('[Test] Checking content script...');
console.log('[Test] URL:', window.location.href);
console.log('[Test] Is LinkedIn profile?', window.location.href.includes('linkedin.com/in/'));

// Test 2: Check storage
chrome.storage.local.get(['networkGraph', 'profile_scrape_cache'], (data) => {
  console.log('[Test] Network Graph:', data.networkGraph);
  console.log('[Test] Nodes:', data.networkGraph?.nodes?.length || 0);
  console.log('[Test] Edges:', data.networkGraph?.edges?.length || 0);
  console.log('[Test] Cache:', data.profile_scrape_cache?.length || 0);
});

// Test 3: Manually test scraping (copy this to browser console)
/*
// Import the scraper
import { scrapePersonProfile } from './src/utils/linkedin-scraper';

// Try scraping current page
const profile = scrapePersonProfile();
console.log('[Test] Scraped profile:', profile);

// If profile exists, try adding to graph
if (profile) {
  import { addProfileToGraph } from './src/services/network-builder-service';

  addProfileToGraph(window.location.href).then(result => {
    console.log('[Test] Add to graph result:', result);
  });
}
*/

// Test 4: Check if profile data exists on page
console.log('[Test] Profile name element:', document.querySelector('h1.text-heading-xlarge')?.textContent);
console.log('[Test] Profile headline:', document.querySelector('div.text-body-medium.break-words')?.textContent);

// Test 5: Listen for NETWORK logs
// Enable in extension settings or check console filter
