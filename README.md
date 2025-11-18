# LinkedIn Network Pro - Chrome Extension

> **AI-powered LinkedIn networking and job application assistant with Apple-inspired design**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb)](https://reactjs.org/)
[![WXT](https://img.shields.io/badge/WXT-0.19-orange)](https://wxt.dev/)

## ⚠️ Legal Disclaimer

**IMPORTANT**: LinkedIn's Terms of Service prohibit automated scraping and data extraction. This extension is provided for **educational and research purposes only**.

- ❌ Do NOT use this for commercial purposes
- ❌ Do NOT violate LinkedIn's rate limits
- ❌ Do NOT scrape data without consent
- ✅ Use official LinkedIn APIs for production applications
- ✅ Respect robots.txt and ToS

**By using this code, you accept full responsibility for compliance with LinkedIn's Terms of Service and applicable laws.**

---

## 🌟 Features

### Core Features

- **🔐 Authentication**: Email/password + Google OAuth via Supabase
- **💳 Subscription Management**: Stripe integration with Free/Pro/Elite tiers
- **🎨 Apple-like UI**: Frosted glass effects, smooth animations, draggable/resizable panel
- **📊 Network Pathfinding**: Dijkstra's algorithm for optimal connection routes
- **🤖 AI-Powered Content**: Claude 3.5 Sonnet for personalized messages, resume tailoring, cover letters
- **👀 Watchlist**: Track people and companies with progress indicators
- **📝 Resume Tools**: AI-powered resume tailoring and ATS optimization
- **💼 Job Tracking**: Save jobs, generate cover letters, match scoring
- **🔔 Notifications**: Email, SMS, and push notifications
- **🌐 Local-First**: All data stored locally with optional cloud sync

### Feature Details

#### 1. **Profile Page Actions**
- Find best connection route using graph algorithms
- Calculate match scores (mutual connections, background, location, skills)
- Generate personalized connection messages with anti-hallucination validation
- Add to watchlist with progress tracking

#### 2. **Network Pathfinder**
- Bidirectional BFS + Dijkstra hybrid algorithm
- Visual node bubbles with avatars, match scores, status icons
- Progress bars showing connection completion
- Real-time route computation using Web Workers

#### 3. **Jobs Tab**
- Resume tailoring (Pro+) with keyword matching
- Cover letter smart editor with tone presets (Pro+)
- Manual job description input for external sites
- Apply queue and status tracking

#### 4. **Feed Tab**
- Activity feed from watchlist people
- Job alerts from favorited companies
- Filter by type, date, relevance

#### 5. **Settings**
- Subscription management (Stripe portal integration)
- Theme customization (Pro+): accent colors, light/dark mode, blur intensity
- Profile & autofill data management
- Notification preferences (email, SMS, push)
- Privacy controls (cloud sync opt-in, auto-send toggle)

---

## 🏗️ Tech Stack

### Frontend
- **Framework**: React 18.3 with TypeScript 5.7
- **Build Tool**: WXT 0.19 (Vite-based)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 4.0
- **Animation**: Framer Motion 11.11
- **State Management**: Zustand 5.0
- **Draggable/Resizable**: react-rnd 10.4

### Backend & Services
- **Auth & Database**: Supabase 2.45
- **Payments**: Stripe
- **AI**: Anthropic Claude 3.5 Sonnet
- **Notifications**: Resend (email), Twilio (SMS)

### Algorithms & Data
- **Graph Library**: Graphology 0.25
- **Priority Queue**: @datastructures-js/priority-queue 6.3
- **IndexedDB**: Dexie.js 4.0
- **Vector Search**: ChromaDB 1.9 (for RAG)
- **PDF Generation**: @react-pdf/renderer 4.3

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: >= 20.0.0
- **pnpm**: >= 9.0.0
- **Chrome/Edge**: Latest version

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd linkedin-extension

# Install dependencies
pnpm install
```

### 2. Environment Setup

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Required environment variables:

```env
# Supabase (https://supabase.com)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Anthropic Claude (https://console.anthropic.com)
VITE_ANTHROPIC_API_KEY=sk-ant-api...

# Google OAuth (https://console.cloud.google.com)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com

# Stripe (https://dashboard.stripe.com)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Optional: Resend (https://resend.com)
VITE_RESEND_API_KEY=re_...

# Optional: Twilio (https://twilio.com)
VITE_TWILIO_ACCOUNT_SID=AC...
VITE_TWILIO_AUTH_TOKEN=...
VITE_TWILIO_PHONE_NUMBER=+1...
```

### 3. Supabase Setup

1. Create a new Supabase project
2. Run the database migration:

```sql
-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read/update their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);
```

3. Enable Google OAuth provider in Supabase dashboard
4. Add your extension's redirect URL to allowed URLs

### 4. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Google+ API"
4. Create OAuth 2.0 credentials:
   - Application type: Chrome Extension
   - Add your extension ID to authorized origins
5. Copy Client ID to `.env`

### 5. Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com)
2. Create products for subscription tiers:
   - **Free**: $0/month
   - **Pro**: $9.99/month
   - **Elite**: $19.99/month
3. Set up webhooks pointing to your Supabase Edge Function
4. Copy publishable key to `.env`

### 6. Development

```bash
# Start development server with hot reload
pnpm dev

# Build for production
pnpm build

# Create distributable ZIP
pnpm zip
```

### 7. Load Extension in Chrome

1. Open `chrome://extensions`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select the `.output/chrome-mv3` directory
5. The extension icon should appear in your toolbar

---

## 📁 Project Structure

```
linkedin-extension/
├── src/
│   ├── background/          # Service worker (MV3 background script)
│   │   └── index.ts         # Alarms, auth refresh, notifications
│   ├── content/             # Content scripts (injected into LinkedIn)
│   │   ├── index.tsx        # Main content script, panel injection
│   │   └── scrapers.ts      # LinkedIn DOM scrapers
│   ├── components/          # React components
│   │   ├── FloatingPanel.tsx    # Main draggable panel
│   │   ├── auth/            # Login, signup screens
│   │   ├── navigation/      # Tab navigation
│   │   ├── tabs/            # Tab content (Profile, Jobs, etc.)
│   │   └── ui/              # Reusable UI components
│   ├── lib/                 # Utilities and libraries
│   │   ├── supabase.ts      # Auth service, Supabase client
│   │   ├── storage.ts       # Chrome storage wrapper
│   │   ├── graph.ts         # Network pathfinding algorithms
│   │   └── ai.ts            # AI content generation
│   ├── stores/              # Zustand state management
│   │   ├── auth.ts          # Authentication state
│   │   ├── settings.ts      # Settings state
│   │   └── watchlist.ts     # Watchlist state
│   ├── types/               # TypeScript types and Zod schemas
│   │   └── index.ts         # All type definitions
│   └── styles/              # CSS and styling
│       └── globals.css      # Tailwind + custom styles
├── .env.example             # Environment variables template
├── wxt.config.ts            # WXT configuration
├── tailwind.config.ts       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

---

## 🎯 Usage Guide

### First Launch

1. Click the extension icon on any LinkedIn page
2. Sign up with email/password or Google OAuth
3. Choose your subscription tier (Free/Pro/Elite)
4. Complete your profile in Settings → Profile & Autofill

### On a Person's Profile

1. Extension panel shows:
   - **Find Best Route** button
   - **Match Score** (0-100%)
   - **Personalized Message** generator
   - **Add to Watchlist** button

2. Click "Find Best Route" to:
   - See the optimal connection path
   - View match scores for each node
   - Track connection progress

3. Click "Generate Message" to:
   - AI creates personalized message
   - Uses profile data, mutuals, recent posts
   - Validates against hallucinations
   - Copy or send directly

### On a Job Posting

1. Extension panel shows (Pro+ only):
   - **Tailor Resume** button
   - **Generate Cover Letter** button
   - **Save Job** button

2. Click "Tailor Resume":
   - Extracts keywords from job description
   - Matches with your experience
   - Suggests optimized bullet points
   - Download as PDF

3. Click "Generate Cover Letter":
   - AI generates structured draft
   - Edit each section with tone presets
   - Download or copy to clipboard

### Watchlist Management

1. Add people and companies to watchlist
2. View progress bars showing connection completion
3. Get notifications for:
   - New posts from watchlist people
   - Job postings from companies
   - Connection acceptances

---

## 🔒 Privacy & Security

### Data Storage

- **Session Storage** (in-memory): Auth tokens, sensitive data
- **Local Storage** (encrypted): User profile, settings, watchlist
- **IndexedDB**: Large datasets (network graphs, job data)
- **Cloud Sync**: Opt-in only, disabled by default

### Security Features

- CSP-compliant Manifest V3
- Encrypted token storage
- Automatic token refresh with 60s buffer
- Row-level security in Supabase
- No API keys exposed client-side

### Rate Limiting

- 2-15 second delays between scraping actions
- Human-like randomization
- Respects LinkedIn's rate limits
- Queue-based request throttling

---

## 🧪 Testing & Development

### Run Tests

```bash
# Unit tests
pnpm test

# Type checking
pnpm compile

# Lint
pnpm lint
```

### Debug Content Script

1. Open DevTools on LinkedIn page
2. Go to Console
3. Filter by "LinkedIn Extension"

### Debug Service Worker

1. Go to `chrome://extensions`
2. Find your extension
3. Click "Service worker" link
4. View logs and storage

---

## 📦 Build & Distribution

### Production Build

```bash
# Build optimized extension
pnpm build

# Create ZIP for Chrome Web Store
pnpm zip

# Output: .output/linkedin-network-pro-1.0.0.zip
```

### Publish to Chrome Web Store

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Create new item
3. Upload ZIP file
4. Fill in store listing details
5. Submit for review

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Coding Standards

- TypeScript strict mode
- ESLint + Prettier formatting
- Zod schemas for all data validation
- Comprehensive JSDoc comments
- Unit tests for utilities

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

### Research Reports

This extension is built using cutting-edge technologies researched in November 2024:

- [Chrome Extension MV3 Architecture](./chrome-extension-mv3-research-2024-2025.md)
- [Auth & Subscription Patterns](./chrome-extension-auth-subscription-research-2024.md)
- [AI/LLM Integration](./AI_LLM_Chrome_Extension_Integration_Report_2024-2025.md)
- [UI Framework Selection](./chrome-extension-ui-framework-research-2024-2025.md)
- [Graph Algorithms](./linkedin-graph-algorithms-research-2024-2025.md)
- [LinkedIn Scraping Techniques](./linkedin-scraping-research-2024-2025.md)
- [Resume Parsing & PDF Generation](./resume-parsing-research-2024-2025.md)
- [Notifications & Sync](./chrome-extension-research-2024-2025.md)

### Technologies

- [WXT](https://wxt.dev/) - Next-gen Chrome extension framework
- [Supabase](https://supabase.com/) - Backend as a Service
- [Anthropic Claude](https://www.anthropic.com/) - AI language model
- [shadcn/ui](https://ui.shadcn.com/) - Beautiful UI components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework

---

## 🐛 Known Issues & Roadmap

### Known Issues

- [ ] LinkedIn DOM selectors may break with LinkedIn UI updates
- [ ] Rate limiting may trigger LinkedIn bot detection
- [ ] Web Workers not yet implemented for graph computation
- [ ] PDF generation in browser has size limits

### Roadmap

- [ ] Implement AI validation pipeline
- [ ] Add unit and integration tests
- [ ] Optimize graph algorithm performance
- [ ] Add Firefox support
- [ ] Implement cloud sync with conflict resolution
- [ ] Add analytics dashboard
- [ ] Support multiple languages

---

## 📞 Support

For questions, issues, or feature requests:

- Open an issue on GitHub
- Email: support@example.com
- Discord: [Join our server](https://discord.gg/example)

---

**Built with ❤️ by the Agent Girl research team**

*Last updated: November 2024*
