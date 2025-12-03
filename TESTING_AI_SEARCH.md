# AI Search Testing Guide

## Overview

The LinkedIn Network Pro extension now has **two search modes**:

1. **AI Chat Mode** (ChatGPT-like) - Conversational AI responses with natural language understanding
2. **Fast Search Mode** - Instant algorithmic search without AI

Both modes use the same backend search engine, but AI mode wraps results in conversational responses.

---

## Setup Instructions

### 1. Build the Extension

```bash
cd /Users/imorgado/Documents/projects/linkedin-network-pro
npm run build
```

### 2. Load Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (top right toggle)
3. Click "Load unpacked"
4. Select `.output/chrome-mv3/` folder
5. Extension should appear in your toolbar

### 3. Configure API Keys

Edit `.env` file and add your API keys:

```env
VITE_OPENAI_API_KEY=sk-proj-your-key-here
# OR
VITE_ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Then rebuild:
```bash
npm run build
```

### 4. Load Test Data

1. Visit any LinkedIn page (e.g., linkedin.com/feed)
2. Click the extension icon to open the panel
3. Open browser console (F12)
4. Run:
   ```javascript
   // Import the test data generator
   const { generateTestData } = await import(chrome.runtime.getURL('src/utils/test-data-generator.ts'));
   await generateTestData();
   ```

   **Simplified version** (if exposed to window):
   ```javascript
   await window.loadTestData();
   ```

---

## Test Scenarios

### Scenario 1: "Who endorsed Alex Hormozi?"

**Expected AI Response:**
```
Let me search through your network for people who endorsed Alex Hormozi...

I found that Alex Hormozi has 4 skills with endorsements:

1. **Leadership** (500 endorsements)
   - Jennifer Lee
   - Robert Garcia
   - Amanda Wilson

2. **Business Strategy** (450 endorsements)
   - Sarah Chen
   - Mike Johnson
   - Emily Rodriguez

3. **Sales** (380 endorsements)
   - John Smith
   - Lisa Anderson

4. **Marketing** (320 endorsements)
   - David Kim
   - Rachel Brown

Would you like me to find the best path to connect with any of these people?
```

---

### Scenario 2: "Who endorsed Alex Hormozi for leadership?"

**Expected AI Response:**
```
Alex Hormozi's "Leadership" skill has 500 endorsements from:

1. Jennifer Lee
2. Robert Garcia
3. Amanda Wilson

These are the people in your network who have vouched for Alex's leadership abilities. Would you like to learn more about any of them?
```

---

### Scenario 3: "Find ML engineers at Google"

**Expected AI Response:**
```
I found 1 person matching your search:

**John Smith** (2nd degree, 88% match)
- Senior ML Engineer at Google
- Company: Google
- Role: Senior ML Engineer
- Reasoning: 2nd-degree connection, role matches "ML engineer", works at Google

John has a PhD in Machine Learning from Stanford and previously worked at OpenAI. He's endorsed for Machine Learning (480), Python (420), and TensorFlow (390).

Would you like me to find the best path to connect with John?
```

---

### Scenario 4: "Who do I know at Netflix?"

**Expected AI Response:**
```
I found 1 person at Netflix in your network:

**Emily Rodriguez** (2nd degree, 75% match)
- Marketing Director at Netflix
- Company: Netflix
- Role: Marketing Director
- Reasoning: 2nd-degree connection, works at Netflix, complete profile

Emily leads brand strategy for Netflix Originals and previously worked at Disney and HBO. She's based in Los Angeles, California.

Would you like me to find how to connect with Emily?
```

---

### Scenario 5: "Tell me about Sarah Chen"

**Follow-up question after previous search**

**Expected AI Response:**
```
Sarah Chen is a VP of Sales at TechCorp with extensive SaaS growth experience.

**Profile Details:**
- Current Role: VP of Sales at TechCorp
- Location: San Francisco, California
- Industry: Software
- Connection: 1st degree (direct connection)
- Match Score: 78%

**Experience:**
- VP of Sales at TechCorp (2021 - Present)
- Enterprise Account Executive at Salesforce (2018 - 2021)

**Education:**
- MBA in Business Administration from Stanford University (2016-2018)

**Top Skills:**
- Sales Leadership (280 endorsements)
- SaaS (210 endorsements)
- Business Development (190 endorsements)

Sarah recently engaged with Alex Hormozi's post about "How to scale your business" 2 days ago.

Since Sarah is your 1st degree connection, you can message her directly!
```

---

### Scenario 6: "Who works in AI?"

**Expected AI Response:**
```
I found 1 person working in AI:

**John Smith** (2nd degree, 88% match)
- Senior ML Engineer at Google | AI Research
- Building the future of AI at Google Brain
- PhD in Machine Learning from Stanford

John has extensive AI research experience, having worked at both Google and OpenAI. His profile shows strong endorsements for Machine Learning, Python, and TensorFlow.

Would you like me to find the best path to connect with John through your mutual connection Mike Johnson?
```

---

## Comparison: AI Mode vs Fast Mode

### AI Chat Mode (ON)
- **Icon**: ✨ Sparkles
- **Placeholder**: "Ask me anything about your network..."
- **Response**: Full conversational explanation with context
- **Latency**: ~2-3 seconds (includes OpenAI/Anthropic API call)
- **Cost**: ~$0.001 per search
- **Best for**: Understanding results, getting explanations, follow-up questions

### Fast Search Mode (OFF)
- **Icon**: 🔍 Magnifying glass
- **Placeholder**: "Search your network..."
- **Response**: Raw search results only
- **Latency**: <500ms (local IndexedDB query)
- **Cost**: Free
- **Best for**: Quick lookups, frequent searches, testing

---

## Toggle Between Modes

Click the **"AI Chat" / "Fast Search"** button at the top of the search box to switch modes.

---

## Troubleshooting

### No API Key Configured

**Error**: "OpenAI client not initialized. Please add VITE_OPENAI_API_KEY to .env"

**Fix**:
1. Add API key to `.env`
2. Rebuild: `npm run build`
3. Reload extension in Chrome

### No Search Results

**Error**: "I couldn't find anyone matching..."

**Causes**:
1. IndexedDB is empty (no test data loaded)
2. Query doesn't match any profiles

**Fix**:
```javascript
// Load test data
await window.loadTestData();

// Try a test query
"Find ML engineers at Google"
```

### AI Response is Generic

**Issue**: AI says "I need access to your network graph"

**Cause**: Network graph not loaded into chatAgent

**Fix**: The AI search uses a separate `aiSearchChat` instance that queries IndexedDB directly. Make sure test data is loaded.

---

## Data Collection Status

✅ **Currently Collected:**
- Profile data (name, headline, company, role, location, about)
- Work experience (company, title, duration, location)
- Education (school, degree, field, start/end years)
- Skills with endorsement **counts**
- Connection degree (1st, 2nd, 3rd)
- Engagement data (posts commented on, reactions, shares)
- Mutual connections

✅ **NEW: Endorsement Scraping (Optional)**
- `endorsedBy` array - **WHO endorsed each skill**
  - Clicks each skill to open endorsement modal
  - Scrolls through all endorsers
  - Extracts profile IDs of endorsers
  - **Slower:** Adds ~2-3 seconds per skill (5 skills = +10-15 seconds)
  - **Human-like delays:** 800-1500ms between actions to avoid detection
  - **Rate limited:** 1.5-3 second delays between skills
  - **Opt-in:** Must set `includeEndorsers: true` in scraper options
  - **Default:** Scrapes top 5 skills (configurable via `maxEndorsedSkills`)
  - Test data includes endorsers for demonstration without needing to scrape

**How to Enable Endorsement Scraping:**
```typescript
// In network-builder-service.ts or when calling scrapeProfileData
const profileData = await scrapeProfileData({
  includeActivity: true,
  includeEndorsers: true,  // Enable endorsement scraping
  maxEndorsedSkills: 5,    // Limit to top 5 skills (default: 5)
});
```

---

## Example Test Session

```javascript
// 1. Load test data
await window.loadTestData();

// 2. Switch to AI Chat mode (click toggle button)

// 3. Try queries:
//    - "Who endorsed Alex Hormozi?"
//    - "Find ML engineers at Google"
//    - "Who do I know at Netflix?"

// 4. Follow-up:
//    - "Tell me more about Sarah Chen"
//    - "How can I connect with John Smith?"

// 5. Switch to Fast Search mode and compare
//    - Same queries, instant results, no AI explanation

// 6. Clean up when done
await window.clearTestData();
```

---

## Cost Estimates

### AI Chat Mode (OpenAI GPT-4o-mini)
- **Per Search**: ~500 tokens input + 300 tokens output = 800 tokens
- **Cost**: $0.15 per 1M input tokens, $0.60 per 1M output tokens
- **Calculation**: (500 * $0.15 + 300 * $0.60) / 1M = **$0.00036 per search**
- **100 searches**: **$0.036** (less than 4 cents)

### AI Chat Mode (Anthropic Claude 3.5 Sonnet)
- **Cost**: $3.00 per 1M input tokens, $15.00 per 1M output tokens
- **Calculation**: (500 * $3.00 + 300 * $15.00) / 1M = **$0.006 per search**
- **100 searches**: **$0.60** (60 cents)

**Recommendation**: Use GPT-4o-mini for search (20x cheaper, works great)

---

## Next Steps

1. ✅ AI chat interface implemented
2. ✅ Test data generator created
3. ✅ Toggle between AI/Fast modes
4. ✅ Follow-up question support
5. ✅ Conversational context memory
6. ✅ Build successful

**Ready to test!**

Run test scenarios above and report any issues.
