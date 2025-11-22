/**
 * Test Suite for Current User Extractor
 *
 * Tests extraction from various LinkedIn DOM structures:
 * 1. Global navigation bar (new UI)
 * 2. Global navigation bar (old UI)
 * 3. Profile dropdown menu
 * 4. Meta tags
 * 5. JSON-LD structured data
 * 6. localStorage/sessionStorage
 */

import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import {
  extractCurrentUserFromDOM,
  isUserLoggedIn,
  getCurrentUserProfileUrl,
  getCurrentUserPhotoUrl,
  getCurrentUserPublicId,
} from './src/utils/current-user-extractor';

// ============================================================================
// MOCK DOM SETUP
// ============================================================================

describe('Current User Extractor', () => {
  beforeEach(() => {
    // Reset DOM before each test
    document.body.innerHTML = '';
    document.head.innerHTML = '';
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // TEST 1: GLOBAL NAVIGATION BAR (NEW UI)
  // ==========================================================================

  describe('Global Navigation Bar (New UI)', () => {
    it('should extract user from global nav with Me button', () => {
      // Setup: New LinkedIn UI with .global-nav__me
      document.body.innerHTML = `
        <nav class="global-nav">
          <button class="global-nav__me" aria-label="View John Doe's profile">
            <div class="global-nav__me-photo">
              <img class="global-nav__me-photo-img" src="https://media.licdn.com/dms/image/v2/photo.jpg" alt="John Doe's photo">
            </div>
          </button>
          <a href="https://www.linkedin.com/in/john-doe/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('John Doe');
      expect(user?.photoUrl).toBe('https://media.licdn.com/dms/image/v2/photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/john-doe/');
    });

    it('should extract user from global nav with img alt text', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <div class="global-nav__me">
            <img src="https://photo.jpg" alt="Photo of Jane Smith">
          </div>
          <a href="https://www.linkedin.com/in/jane-smith/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Jane Smith');
      expect(user?.photoUrl).toBe('https://photo.jpg');
    });

    it('should extract user with headline from dropdown', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <button class="global-nav__me" aria-label="View Alice Johnson's profile">
            <img src="https://photo.jpg" alt="Alice Johnson's photo">
          </button>
          <div class="global-nav__me-content">
            <span class="t-black--light">Senior Software Engineer at Google</span>
          </div>
          <a href="https://www.linkedin.com/in/alice-johnson/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Alice Johnson');
      expect(user?.headline).toBe('Senior Software Engineer at Google');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/alice-johnson/');
    });
  });

  // ==========================================================================
  // TEST 2: GLOBAL NAVIGATION BAR (OLD UI)
  // ==========================================================================

  describe('Global Navigation Bar (Old UI)', () => {
    it('should extract user from old UI nav card', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <img class="nav-item__profile-member-photo" src="https://photo.jpg" alt="Photo of Bob Wilson">
          <span class="nav-item__profile-member-name t-bold t-black">Bob Wilson</span>
          <a href="https://www.linkedin.com/in/bob-wilson/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Bob Wilson');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/bob-wilson/');
    });

    it('should extract from nav-item__icon img', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <div class="nav-item__icon">
            <img src="https://photo.jpg" alt="Photo of Carol Davis">
          </div>
          <a href="https://www.linkedin.com/in/carol-davis/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Carol Davis');
    });
  });

  // ==========================================================================
  // TEST 3: PROFILE DROPDOWN MENU
  // ==========================================================================

  describe('Profile Dropdown Menu', () => {
    it('should extract user from expanded dropdown', () => {
      document.body.innerHTML = `
        <div class="artdeco-dropdown__content" data-control-name="identity_profile_card">
          <div class="artdeco-entity-lockup">
            <img class="artdeco-entity-lockup__image" src="https://photo.jpg">
            <div class="artdeco-entity-lockup__title">David Martinez</div>
            <div class="artdeco-entity-lockup__subtitle">Product Manager at Meta</div>
          </div>
          <a href="https://www.linkedin.com/in/david-martinez/"></a>
        </div>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('David Martinez');
      expect(user?.headline).toBe('Product Manager at Meta');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/david-martinez/');
    });

    it('should extract from profile-photo class', () => {
      document.body.innerHTML = `
        <div class="artdeco-dropdown__content">
          <img class="profile-photo" src="https://photo.jpg">
          <span class="text-heading-xlarge">Emma Brown</span>
          <span class="text-body-small">Data Scientist</span>
          <a href="https://www.linkedin.com/in/emma-brown/"></a>
        </div>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Emma Brown');
      expect(user?.headline).toBe('Data Scientist');
    });
  });

  // ==========================================================================
  // TEST 4: META TAGS
  // ==========================================================================

  describe('Meta Tags', () => {
    it('should extract user from meta tags when on own profile', () => {
      // Simulate being on own profile page
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.linkedin.com/in/frank-garcia/',
          pathname: '/in/frank-garcia/',
        },
        writable: true,
      });

      document.head.innerHTML = `
        <meta property="og:title" content="Frank Garcia">
        <meta property="og:description" content="Software Architect at Amazon">
        <meta property="og:image" content="https://photo.jpg">
        <meta property="og:url" content="https://www.linkedin.com/in/frank-garcia/">
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Frank Garcia');
      expect(user?.headline).toBe('Software Architect at Amazon');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/frank-garcia/');
    });

    it('should NOT extract from meta tags when on someone else\'s profile', () => {
      // Simulate being on someone else's profile
      Object.defineProperty(window, 'location', {
        value: {
          href: 'https://www.linkedin.com/in/other-person/',
          pathname: '/in/other-person/',
        },
        writable: true,
      });

      document.head.innerHTML = `
        <meta property="og:title" content="Not Me">
        <meta property="og:url" content="https://www.linkedin.com/in/different-person/">
      `;

      const user = extractCurrentUserFromDOM();

      // Should return null because meta tags are for someone else
      expect(user).toBeNull();
    });
  });

  // ==========================================================================
  // TEST 5: JSON-LD STRUCTURED DATA
  // ==========================================================================

  describe('JSON-LD Structured Data', () => {
    it('should extract user from Person schema', () => {
      document.head.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "Person",
          "name": "Grace Lee",
          "jobTitle": "UX Designer",
          "image": "https://photo.jpg",
          "url": "https://www.linkedin.com/in/grace-lee/"
        }
        </script>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Grace Lee');
      expect(user?.headline).toBe('UX Designer');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/grace-lee/');
    });

    it('should extract user from ProfilePage schema', () => {
      document.head.innerHTML = `
        <script type="application/ld+json">
        {
          "@context": "https://schema.org",
          "@type": "ProfilePage",
          "mainEntity": {
            "@type": "Person",
            "name": "Henry Chen",
            "description": "DevOps Engineer",
            "image": {
              "url": "https://photo.jpg"
            },
            "@id": "https://www.linkedin.com/in/henry-chen/"
          }
        }
        </script>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Henry Chen');
      expect(user?.headline).toBe('DevOps Engineer');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/henry-chen/');
    });

    it('should handle invalid JSON gracefully', () => {
      document.head.innerHTML = `
        <script type="application/ld+json">
        { invalid json here
        </script>
      `;

      const user = extractCurrentUserFromDOM();

      // Should not throw error, just return null
      expect(user).toBeNull();
    });
  });

  // ==========================================================================
  // TEST 6: LOCALSTORAGE / SESSIONSTORAGE
  // ==========================================================================

  describe('localStorage/sessionStorage', () => {
    it('should extract user from localStorage li.me key', () => {
      localStorage.setItem('li.me', JSON.stringify({
        miniProfile: {
          firstName: 'Irene',
          lastName: 'Kim',
          headline: 'Marketing Manager',
          picture: 'https://photo.jpg',
          publicIdentifier: 'irene-kim'
        }
      }));

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Irene Kim');
      expect(user?.headline).toBe('Marketing Manager');
      expect(user?.photoUrl).toBe('https://photo.jpg');
      expect(user?.profileUrl).toBe('https://www.linkedin.com/in/irene-kim/');
    });

    it('should extract user from sessionStorage', () => {
      sessionStorage.setItem('voyager.identity', JSON.stringify({
        profile: {
          name: 'Jack Taylor',
          occupation: 'Sales Director',
          profilePicture: {
            displayImage: 'https://photo.jpg'
          },
          url: 'https://www.linkedin.com/in/jack-taylor/'
        }
      }));

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Jack Taylor');
      expect(user?.headline).toBe('Sales Director');
      expect(user?.photoUrl).toBe('https://photo.jpg');
    });

    it('should handle non-JSON storage values', () => {
      localStorage.setItem('li_at', 'not-json-just-a-token');

      const user = extractCurrentUserFromDOM();

      // Should not throw error
      expect(user).toBeNull();
    });
  });

  // ==========================================================================
  // TEST 7: HELPER FUNCTIONS
  // ==========================================================================

  describe('Helper Functions', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <button class="global-nav__me" aria-label="View Test User's profile">
            <img src="https://photo.jpg" alt="Test User's photo">
          </button>
          <a href="https://www.linkedin.com/in/test-user/"></a>
        </nav>
      `;
    });

    it('isUserLoggedIn should return true when user found', () => {
      expect(isUserLoggedIn()).toBe(true);
    });

    it('isUserLoggedIn should return false when no user', () => {
      document.body.innerHTML = '';
      expect(isUserLoggedIn()).toBe(false);
    });

    it('getCurrentUserProfileUrl should return URL', () => {
      const url = getCurrentUserProfileUrl();
      expect(url).toBe('https://www.linkedin.com/in/test-user/');
    });

    it('getCurrentUserPhotoUrl should return photo URL', () => {
      const photoUrl = getCurrentUserPhotoUrl();
      expect(photoUrl).toBe('https://photo.jpg');
    });

    it('getCurrentUserPublicId should extract public identifier', () => {
      const publicId = getCurrentUserPublicId();
      expect(publicId).toBe('test-user');
    });

    it('should return null when no profile URL available', () => {
      document.body.innerHTML = '<nav class="global-nav"></nav>';

      expect(getCurrentUserProfileUrl()).toBeNull();
      expect(getCurrentUserPublicId()).toBeNull();
    });
  });

  // ==========================================================================
  // TEST 8: EDGE CASES
  // ==========================================================================

  describe('Edge Cases', () => {
    it('should handle missing name gracefully', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <img src="https://photo.jpg">
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      // Should return null if no name found
      expect(user).toBeNull();
    });

    it('should handle multiple strategies returning data', () => {
      // Setup multiple sources
      document.body.innerHTML = `
        <nav class="global-nav">
          <img src="https://photo.jpg" alt="User One">
          <a href="https://www.linkedin.com/in/user-one/"></a>
        </nav>
      `;
      document.head.innerHTML = `
        <meta property="og:title" content="User Two">
      `;

      const user = extractCurrentUserFromDOM();

      // Should prefer global nav (first strategy)
      expect(user?.name).toBe('User One');
    });

    it('should handle special characters in name', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <img src="https://photo.jpg" alt="José María O'Brien-Smith's photo">
          <a href="https://www.linkedin.com/in/jose-maria-obrien-smith/"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user?.name).toBe("José María O'Brien-Smith");
    });

    it('should handle malformed URLs', () => {
      document.body.innerHTML = `
        <nav class="global-nav">
          <img src="https://photo.jpg" alt="Test User">
          <a href="/in/test-user"></a>
        </nav>
      `;

      const user = extractCurrentUserFromDOM();

      // Should still extract name and photo
      expect(user?.name).toBe('Test User');
      expect(user?.photoUrl).toBe('https://photo.jpg');
    });
  });

  // ==========================================================================
  // TEST 9: FALLBACK CHAIN
  // ==========================================================================

  describe('Fallback Chain', () => {
    it('should try all strategies in order', () => {
      // No global nav
      document.body.innerHTML = '<div></div>';

      // No dropdown
      // No meta tags matching current page
      document.head.innerHTML = '';

      // Add JSON-LD (4th strategy)
      document.head.innerHTML = `
        <script type="application/ld+json">
        {
          "@type": "Person",
          "name": "Fallback User",
          "url": "https://www.linkedin.com/in/fallback-user/"
        }
        </script>
      `;

      const user = extractCurrentUserFromDOM();

      expect(user).not.toBeNull();
      expect(user?.name).toBe('Fallback User');
    });

    it('should return null when all strategies fail', () => {
      document.body.innerHTML = '';
      document.head.innerHTML = '';
      localStorage.clear();
      sessionStorage.clear();

      const user = extractCurrentUserFromDOM();

      expect(user).toBeNull();
    });
  });
});
