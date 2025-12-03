# AI Features Summary - LinkedIn Network Pro

## 🤖 What Uses AI in the Extension

### 1. **Universal Search (Network Search)** ✅ IMPLEMENTED
**File:** `src/services/universal-connection/search/ai-search-chat.ts`
**Provider:** OpenAI (GPT-4o-mini) or Anthropic (Claude 3.5 Sonnet)
**Cost:** $0.00036 per search (GPT-4o-mini) or $0.00450 (Claude)

**What it does:**
- Converts natural language queries into structured searches
- Generates conversational responses to search results
- Handles follow-up questions with context
- Examples:
  - "Who do I know at Netflix?"
  - "Find people who endorsed leadership"
  - "Show me engineers in San Francisco"

**Configuration:**
```typescript
temperature: 0.4  // Lower for factual responses
maxTokens: 500   // 500 for initial, 400 for follow-ups
```

---

### 2. **Resume Generation** ✅ IMPLEMENTED
**File:** `src/services/ai-resume-generator.ts`
**Provider:** OpenAI or Anthropic
**Cost:** ~$0.01-0.02 per resume

**What it does:**
- Generates ATS-optimized resumes from LinkedIn profile
- Tailors resume to specific job descriptions
- Extracts and matches keywords
- Formats professional resume sections

---

### 3. **Cover Letter Generation** ✅ IMPLEMENTED
**Files:**
- `src/services/cover-letter-generator.ts`
- `src/services/cover-letter-generator-unified.ts`

**Provider:** OpenAI or Anthropic
**Cost:** ~$0.01-0.03 per cover letter

**What it does:**
- Generates personalized cover letters
- Matches user experience to job requirements
- Adapts tone and style
- ATS keyword optimization

---

### 4. **Experience Bullet Rewriter** ✅ IMPLEMENTED
**File:** `src/services/bullet-rewriter/index.ts`
**Provider:** OpenAI or Anthropic

**What it does:**
- Rewrites resume bullets to match job description
- Emphasizes relevant skills and achievements
- ATS-friendly formatting
- Action verb optimization

---

### 5. **LinkedIn Message Generator** ✅ IMPLEMENTED
**File:** `src/services/linkedin-message-generator.ts`
**Provider:** OpenAI or Anthropic

**What it does:**
- Generates personalized connection requests
- Creates introduction messages
- Adapts tone based on relationship
- Context-aware messaging

---

### 6. **Resume Research** ✅ IMPLEMENTED
**File:** `src/services/resume-research.ts`
**Provider:** OpenAI or Anthropic

**What it does:**
- Analyzes job descriptions
- Suggests relevant experience highlights
- Identifies missing keywords
- Recommends improvements

---

## 🔑 AI Provider Configuration

### Current Setup
**File:** `src/services/ai-provider.ts`

**Supported Providers:**
1. **OpenAI**
   - Models: `gpt-4o`, `gpt-4o-mini` (default)
   - Default: `gpt-4o-mini` (cheapest, fastest)

2. **Anthropic**
   - Models: `claude-3-5-sonnet-20241022` (default), `claude-3-haiku-20240307`
   - Default: `claude-3-5-sonnet-20241022` (best quality)

### Environment Variables
```bash
# .env file
VITE_OPENAI_API_KEY=your-key-here
VITE_ANTHROPIC_API_KEY=your-key-here
```

**Provider Selection:**
```typescript
import { aiProvider } from './services/ai-provider';

// Switch provider
aiProvider.setProvider('anthropic'); // or 'openai'

// Get current provider
const current = aiProvider.getProvider();
```

---

## 💰 Cost Breakdown

### Per-Feature Costs (using GPT-4o-mini)

| Feature | Cost per Use | Monthly (100 uses) |
|---------|-------------|-------------------|
| Search (AI Chat) | $0.00036 | $0.036 |
| Resume Generation | $0.015 | $1.50 |
| Cover Letter | $0.025 | $2.50 |
| Message Generation | $0.005 | $0.50 |
| Bullet Rewriter | $0.008 | $0.80 |

**Total monthly (100 uses each):** ~$5.40

### Per-Feature Costs (using Claude 3.5 Sonnet)

| Feature | Cost per Use | Monthly (100 uses) |
|---------|-------------|-------------------|
| Search (AI Chat) | $0.00450 | $0.45 |
| Resume Generation | $0.045 | $4.50 |
| Cover Letter | $0.075 | $7.50 |
| Message Generation | $0.015 | $1.50 |
| Bullet Rewriter | $0.024 | $2.40 |

**Total monthly (100 uses each):** ~$16.35

---

## 🎯 What Does NOT Use AI

### Algorithmic Features (No AI Cost)

1. **Connection Path Finding** (5-strategy pathfinding)
   - Uses graph algorithms (A*, BFS, Dijkstra)
   - Profile similarity calculations
   - Engagement analysis
   - Company bridge detection

2. **Network Graph Building**
   - LinkedIn scraping
   - Connection mapping
   - Profile data extraction

3. **Job Scraping**
   - Job board scraping
   - ATS keyword extraction (rule-based)
   - Company monitoring

4. **Watchlist & Feed**
   - Connection monitoring
   - Job alerts
   - Activity tracking

5. **Fast Search Mode**
   - Algorithmic network search
   - No AI-generated responses
   - Instant results

---

## 🚀 AI Feature Toggle

Users can switch between:
- **AI Chat Mode:** Conversational, AI-powered responses
- **Fast Search Mode:** Instant algorithmic results (no AI)

**UI Toggle:** Search Tab → "AI Chat" / "Fast Search" button

---

## 📊 Usage Recommendations

### For Cost Optimization:
1. **Default to GPT-4o-mini** (3-10x cheaper than Claude)
2. **Use Fast Search** when speed matters more than conversational UX
3. **Limit AI features** to resume/cover letter generation for free tier

### For Best Quality:
1. **Use Claude 3.5 Sonnet** for resume/cover letter (better writing quality)
2. **Use GPT-4o-mini** for search (factual, cheap)
3. **Enable AI Chat** for better user experience

---

## 🔧 How to Disable AI (Fallback Mode)

If no API keys are configured:
- Search reverts to **Fast Search** (algorithmic only)
- Resume/Cover letter generation will fail gracefully
- Connection path finding still works (no AI needed)

---

## 📝 Future AI Integrations (Planned)

1. **Profile Score Analysis** (AI-powered LinkedIn profile audit)
2. **Interview Prep** (AI-generated interview questions)
3. **Salary Negotiation Coach** (AI conversation simulator)
4. **Career Path Recommendations** (AI-powered career analysis)

---

**Last Updated:** December 3, 2025
