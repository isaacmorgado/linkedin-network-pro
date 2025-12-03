# Endorsement Scraping Guide

## Overview

The extension now includes **endorsement scraping** - the ability to discover **WHO** endorsed someone's skills, not just the count. This enables powerful pathfinding through endorsement relationships.

## Why This Matters

### Use Case: Finding Connection Paths

**Scenario:**
- You want to connect with Alex Hormozi
- ABC is your 3rd-degree connection
- ABC endorsed Alex Hormozi for "Leadership"

**With Endorsement Scraping:**
The system can identify that ABC has a **touchpoint** with Alex through endorsement, making ABC your best path to reach Alex.

**AI Query Examples:**
- *"What is the shortest path to Alex Hormozi?"*
  - Response: "Your best path is through ABC (3rd degree), who endorsed Alex for Leadership. Here's how to connect..."

- *"Who endorsed Alex Hormozi?"*
  - Response: "Alex has endorsements from Sarah Chen (1st degree), Mike Johnson (2nd degree), and ABC (3rd degree). Sarah is your direct connection and best introduction path."

---

## How It Works

### Technical Flow

1. **Click Skill** - Automatically clicks endorsement count to open modal
2. **Wait for Modal** - Detects when endorsement modal appears (5s timeout)
3. **Scroll to Load** - Scrolls through endorser list to load all profiles (lazy loading)
4. **Extract IDs** - Scrapes profile IDs from all endorser links
5. **Close Modal** - Clicks close button or presses Escape
6. **Repeat** - Processes next skill with human-like delays

### Anti-Detection Measures

**Human-Like Behavior:**
- ✅ Random delays (800-1500ms) before clicking
- ✅ Scroll speed variation
- ✅ 1.5-3 second delays between skills
- ✅ Graceful failure handling
- ✅ Modal close detection

**Rate Limiting:**
- Default: Scrapes top **5 skills** (configurable)
- ~2-3 seconds per skill
- Total time: ~10-15 seconds for 5 skills

---

## Usage

### Basic Usage

```typescript
import { scrapeProfileData } from '@/lib/scrapers/profile-scraper';

// Without endorsement scraping (fast)
const profile = await scrapeProfileData({
  includeActivity: true,
});
// Skills will have: { name, endorsementCount, endorsedBy: [] }

// WITH endorsement scraping (slower, but complete)
const profile = await scrapeProfileData({
  includeActivity: true,
  includeEndorsers: true,       // Enable WHO endorsed scraping
  maxEndorsedSkills: 5,         // Limit to top 5 skills
});
// Skills will have: { name, endorsementCount, endorsedBy: ['sarah-chen', 'mike-johnson', ...] }
```

### Advanced Usage

```typescript
import { scrapeMultipleSkillEndorsers } from '@/lib/scrapers/endorsement-scraper';

// Scrape specific skills
const skills = [
  { element: skillElement1, name: 'Leadership' },
  { element: skillElement2, name: 'Business Strategy' },
];

const endorserMap = await scrapeMultipleSkillEndorsers(skills, 10); // Max 10 skills

// endorserMap.get('Leadership') → ['sarah-chen', 'mike-johnson', ...]
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `includeEndorsers` | `boolean` | `false` | Enable endorsement scraping |
| `maxEndorsedSkills` | `number` | `5` | Max skills to scrape endorsers for |

---

## Integration with Pathfinding

### Endorsement Bridge Strategy

The `engagement_bridge` pathfinding strategy now uses endorsement data:

```typescript
// In strategy-engagement-bridge.ts
const steppingStones = findSteppingStones(sourceUser, targetUser);
// Now includes people who ENDORSED the target
// Not just people who commented/reacted on their posts
```

**Path Quality Scoring:**
- **Endorsement:** Higher trust signal than comment/reaction
- **Skill relevance:** Matches your field = stronger connection
- **Recent endorsement:** Last 6 months = more active relationship

---

## Performance Considerations

### Speed Impact

| Scenario | Time | Notes |
|----------|------|-------|
| **Without endorsers** | ~3-5 seconds | Standard profile scrape |
| **With endorsers (5 skills)** | ~13-20 seconds | +10-15 seconds for endorsements |
| **With endorsers (10 skills)** | ~23-35 seconds | +20-30 seconds for endorsements |

### When to Enable

**Enable endorsement scraping when:**
- ✅ Building initial network graph (one-time)
- ✅ Scraping high-value target profiles
- ✅ Need complete pathfinding data
- ✅ Running overnight batch jobs

**Disable endorsement scraping when:**
- ❌ Quick profile lookups
- ❌ Real-time scraping during browsing
- ❌ Low connection count targets (<50 connections)
- ❌ Testing/development

---

## Detection Risk

### Risk Level: **Low-Medium**

**Why Low:**
- Mimics human behavior (clicks, scrolls, delays)
- Uses standard browser interactions
- No API abuse or bot signatures

**Why Medium:**
- Multiple modal interactions detectable
- Higher request volume than passive browsing
- LinkedIn may track "suspicious" patterns

### Best Practices

1. **Don't overuse** - Scrape endorsers only for important profiles
2. **Batch wisely** - Scrape 10-20 profiles max per session
3. **Add delays** - Use 30-60 second delays between profiles
4. **Rotate sessions** - Don't run continuously for hours
5. **Monitor warnings** - Watch for LinkedIn security notifications

---

## Data Structure

### Before (Endorsement Count Only)

```typescript
{
  skills: [
    {
      name: 'Leadership',
      endorsementCount: 500,
      endorsedBy: [], // Empty!
    }
  ]
}
```

### After (With Endorser IDs)

```typescript
{
  skills: [
    {
      name: 'Leadership',
      endorsementCount: 500,
      endorsedBy: [
        'sarah-chen',      // 1st degree connection
        'mike-johnson',    // 2nd degree connection
        'jennifer-lee',    // 3rd degree connection
        'robert-garcia',
        'amanda-wilson',
        // ... up to 500 endorsers
      ],
    }
  ]
}
```

---

## Error Handling

### Common Errors

**Modal doesn't open:**
```
[EndorsementScraper] Modal did not appear for Leadership
```
- **Cause:** Endorsement button not clickable or modal blocked
- **Handling:** Skips skill, continues with next one
- **Impact:** Partial data (some skills missing endorsers)

**Close button not found:**
```
[EndorsementScraper] Could not find close button, modal may remain open
```
- **Cause:** LinkedIn UI changed or modal has different structure
- **Handling:** Presses Escape key as fallback
- **Impact:** Modal may remain open, affects next skill

**Extraction error:**
```
[EndorsementScraper] Error extracting activity: ...
```
- **Cause:** Unexpected DOM structure
- **Handling:** Returns whatever endorsers were collected before error
- **Impact:** Partial endorser list for that skill

---

## Testing

### Test with Fake Data

The test data generator includes endorsement relationships:

```typescript
// Load test data
await window.loadTestData();

// Test queries
"Who endorsed Alex Hormozi?"
// → Shows Sarah Chen, Mike Johnson, Emily Rodriguez

"Who endorsed Alex Hormozi for leadership?"
// → Shows Jennifer Lee, Robert Garcia, Amanda Wilson

"What is the shortest path to Alex Hormozi?"
// → Recommends Sarah Chen (1st degree) who endorsed him
```

### Test with Real Data

```typescript
// Enable endorsement scraping for a profile
const profileUrl = 'https://www.linkedin.com/in/alex-hormozi';
window.location.href = profileUrl;

// Wait for page load, then scrape
const profile = await scrapeProfileData({
  includeEndorsers: true,
  maxEndorsedSkills: 3, // Start with 3 for testing
});

console.log(profile.skills);
// Should show endorsedBy arrays with profile IDs
```

---

## Troubleshooting

### Q: Endorsers array is empty despite enabling the feature

**A:** Check console logs:
- `[EndorsementScraper] Scraping endorsers for skills...` - Feature enabled
- `[EndorsementScraper] Found X endorser links` - Extraction working
- If no logs appear, endorsement scraping may not be enabled in options

### Q: Scraping is very slow

**A:** This is expected behavior:
- 2-3 seconds per skill × 5 skills = 10-15 seconds
- Reduce `maxEndorsedSkills` to 3 for faster scraping
- Or disable endorsement scraping for quick lookups

### Q: LinkedIn shows security warning

**A:** Reduce scraping frequency:
- Wait 30-60 seconds between profiles
- Scrape max 10-15 profiles per session
- Don't run continuously for hours
- Use during normal browsing hours (not 3am)

### Q: Modal gets stuck open

**A:** The scraper tries multiple close methods:
1. Click close button
2. Press Escape key
3. If still stuck, manually close and continue

---

## Future Enhancements

### Potential Improvements

1. **Smart skill selection** - Prioritize skills with most mutual connections
2. **Endorser details** - Scrape endorser headlines/roles
3. **Endorsement dates** - Track when endorsements were given (recency matters)
4. **Mutual endorsements** - Detect bidirectional endorsements (stronger signal)
5. **Skill clustering** - Group related skills to avoid redundant scraping

### Known Limitations

1. **LinkedIn may hide endorsers** - Some profiles hide who endorsed them
2. **Pagination limits** - Modal may not load all 500+ endorsers
3. **DOM changes** - LinkedIn UI updates may break selectors
4. **Rate limits** - LinkedIn may throttle frequent modal opens

---

## Summary

**✅ What You Gain:**
- Complete endorsement network data
- Endorsement-based pathfinding
- Identify "warm intro" paths through endorsers
- Prioritize connections with mutual endorsers

**⚠️ Trade-offs:**
- 2-3 seconds per skill slower
- Slightly higher detection risk
- More complex error handling

**🎯 Recommendation:**
- Enable for **high-value targets** (CEOs, decision-makers, dream connections)
- Disable for **bulk scraping** (>50 profiles per session)
- Use **test data** for development/testing to avoid real API calls
