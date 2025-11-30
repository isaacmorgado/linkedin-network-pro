# LinkedIn Network Pro - Development Guidelines

## Core Principles

### Code Quality
- Write clean, maintainable code following project conventions
- Prefer existing patterns over introducing new ones
- Check similar components before building new features
- Test changes before marking tasks complete

### File Organization
- Read relevant source files before making changes
- Understand existing architecture before adding features
- Keep related code together
- Use consistent naming conventions

---

## 🚨 CRITICAL GROUND RULE: File Size Limits

### General Files
**All source files MUST be split into separate modules when they exceed 300 lines of code.**

### Pathfinding & Scoring Files (STRICT ENFORCEMENT)

**MANDATORY RULE:** Any pathfinding, graph algorithm, or scoring file **MUST** be split into separate modules when it exceeds **300 lines of code**.

**Affected Files/Modules:**
- Any file in `/src/services/universal-connection/`
- Any file in `/src/lib/` related to graphs or algorithms
- Profile similarity calculators
- Intermediary scoring logic
- Pathfinding algorithms
- Graph data structures
- Network builders

**When Refactoring/Creating Pathfinding Files:**

1. **Before Writing:** Plan module structure if expected to exceed 300 lines
2. **During Writing:** Monitor line count and split proactively at 250+ lines
3. **After Writing:** Immediately refactor if > 300 lines detected
4. **Review:** All PRs with pathfinding changes must verify line counts

**Splitting Strategy:**

```
Example: profile-similarity.ts (756 lines) → MUST SPLIT INTO:

/src/services/universal-connection/profile-similarity/
├── index.ts (< 200 lines)           # Main calculator & exports
├── jaccard-similarity.ts (< 150)    # Jaccard index calculations
├── education-matcher.ts (< 150)     # Education overlap logic
├── location-matcher.ts (< 150)      # Location similarity
├── industry-matcher.ts (< 150)      # Industry overlap
├── composite-scorer.ts (< 150)      # Weighted composite scoring
├── types.ts                         # Type definitions
└── constants.ts                     # Weights & thresholds
```

**Enforcement Checklist:**
- [ ] All files < 300 lines (check: `wc -l src/services/universal-connection/*.ts`)
- [ ] Single responsibility per module
- [ ] Exports preserved for backward compatibility
- [ ] Tests pass after refactoring

---

## Current Violations (MUST FIX)

Based on analysis, these files currently violate the 300-line rule:

**HIGH PRIORITY - Pathfinding/Scoring:**
1. ❌ `profile-similarity.ts` (756 lines) - **MUST SPLIT**
2. ❌ `intermediary-scorer.ts` (702 lines) - **MUST SPLIT**
3. ❌ `universal-pathfinder.ts` (646 lines) - **MUST SPLIT**
4. ❌ `graph.ts` (399 lines) - **MUST SPLIT**
5. ❌ `scrapers.ts` (401 lines) - **MUST SPLIT**

**Acceptable (Data Files):**
- ✅ `industry-mapping.ts` (846 lines) - Data file, intentionally large
- ✅ Test files (can be larger due to test cases)

---

## Refactoring Protocol

### When a File Exceeds 300 Lines:

1. **STOP** - Do not add more code
2. **ANALYZE** - Identify logical sections/responsibilities
3. **PLAN** - Design module structure (see template below)
4. **EXTRACT** - Create subdirectory and split files
5. **TEST** - Verify all tests pass
6. **DOCUMENT** - Update this file with new structure

### Module Structure Template:

```typescript
// For a file named "example-algorithm.ts" (500 lines)

/src/services/example-algorithm/
├── index.ts                    # Main orchestrator (< 200 lines)
│   └── Re-exports all public functions
├── core-logic.ts              # Core algorithm (< 250 lines)
├── helpers.ts                 # Utility functions (< 200 lines)
├── validators.ts              # Validation logic (< 150 lines)
├── types.ts                   # Type definitions (< 150 lines)
└── constants.ts               # Configuration & constants (< 100 lines)
```

### Backward Compatibility:

```typescript
// index.ts - Barrel export pattern
export {
  mainFunction,
  helperFunction1,
  helperFunction2,
} from './core-logic';

export { validate, sanitize } from './validators';
export * from './types';
```

---

## Project Context & Dependencies

**Before building features:**
1. Find and read project manifest (`package.json`)
2. Check available dependencies, scripts, and tools
3. Ask permission before adding new dependencies
4. Prefer using existing dependencies over adding new ones

---

## Validation After Changes

**After creating or editing pathfinding/scoring files:**

1. **Line Count:** `wc -l src/services/universal-connection/*.ts` (all files < 300 lines)
2. **Compilation:** `npm run compile` (must pass)
3. **Tests:** `npm test` (all tests pass)
4. **Performance:** `npm run test:stress` (verify targets in table below)

---

## Performance Targets for Pathfinding

| Operation | Target | How to Measure |
|-----------|--------|----------------|
| Pathfinding (average) | < 3s | Stress test suite |
| Similarity calculation | < 100ms | Profile similarity tests |
| Intermediary scoring | < 500ms | Intermediary scorer tests |
| Cache hit rate | > 70% | Cache metrics logging |
| Graph construction | < 1s | Network builder tests |

---

## Git Commit Guidelines

**For pathfinding/scoring changes, use descriptive messages:**
- ✅ "refactor: split profile-similarity.ts into 5 modules (756→200 lines)"
- ✅ "feat(pathfinding): add A* heuristic to universal-pathfinder"
- ❌ "fix stuff" or "update pathfinding"

---

## Code Review Checklist

**For Pathfinding PRs:**
- [ ] All files < 300 lines (split if needed)
- [ ] Compilation, tests, and performance benchmarks pass
- [ ] No breaking changes to exports
- [ ] Single responsibility per file

---

## Architecture Patterns (Pathfinding-Specific)

### 1. **Separation of Concerns**
```
✅ GOOD: profile-similarity/jaccard-similarity.ts
   - Only contains Jaccard index calculation
   - Single, clear responsibility

❌ BAD: profile-similarity.ts (756 lines)
   - Contains Jaccard, education, location, industry, composite scoring
   - Multiple responsibilities
```

### 2. **Barrel Export Pattern**
```typescript
// index.ts
export { calculateSimilarity } from './core';
export { JaccardIndex } from './jaccard';
export * from './types';
```

### 3. **Dependency Injection**
```typescript
// Good: Configurable weights
calculateSimilarity(p1, p2, config?: SimilarityConfig)

// Bad: Hardcoded weights
const INDUSTRY_WEIGHT = 0.30; // Can't override
```

---

## Emergency Refactoring Protocol

**If you discover a pathfinding file > 300 lines:**

1. **Immediate Actions:**
   - Create GitHub issue: "Refactor [filename] - exceeds 300 line limit"
   - Tag as `tech-debt` and `high-priority`
   - Assign to next sprint

2. **Temporary Workaround:**
   - Add comment at top of file:
   ```typescript
   /**
    * ⚠️ WARNING: This file exceeds 300 line limit (current: XXX lines)
    * TODO: Refactor into modules before adding new features
    * Issue: #XXX
    */
   ```

3. **Refactor BEFORE Adding Features:**
   - Do NOT add new code to oversized files
   - Refactor first, then add features
   - Exception: Critical hotfixes only

---

## Tools & Scripts

### Check File Sizes:
```bash
# Check all pathfinding files
find src/services/universal-connection -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | sort -rn

# Check for violations
find src/services/universal-connection -name "*.ts" ! -name "*.test.ts" -exec wc -l {} \; | awk '$1 > 300 {print "❌ VIOLATION:", $2, "("$1" lines)"}'
```

### Auto-split Helper (Future Tool):
```bash
# Analyze file and suggest split points
npm run analyze-split src/services/universal-connection/profile-similarity.ts
```

---

## Examples of Good Structure

### ✅ Storage Layer (After Refactoring):
```
storage.ts (2,836 lines) → 179 lines
  ↓
/storage/
├── watchlist-storage.ts (124 lines) ✅
├── profile-storage.ts (270 lines) ✅
├── skills-storage.ts (256 lines) ✅
└── ... (13 modules total)
```

### ✅ Component Layer (After Refactoring):
```
ResumeTab.tsx (3,696 lines) → 200 lines
  ↓
/ResumeTab/
├── experience/ (5 files, max 350 lines) ✅
├── skills/ (9 files, max 377 lines) ✅
├── education/ (5 files, max 268 lines) ✅
└── ... (24 modules total)
```

### 🎯 Target for Pathfinding:
```
profile-similarity.ts (756 lines) → < 200 lines
  ↓
/profile-similarity/
├── index.ts (< 200 lines)
├── jaccard.ts (< 150 lines)
├── education.ts (< 150 lines)
├── location.ts (< 150 lines)
├── industry.ts (< 150 lines)
├── composite.ts (< 150 lines)
└── types.ts
```

---

## Contact & Questions

**For questions about this guideline:**
- Review existing refactored modules (storage/, ResumeTab/)
- Check GitHub issues tagged `refactoring`
- Refer to Agent 1 & 2 analysis reports

**Last Updated:** November 23, 2025
**Guideline Version:** 1.0
**Status:** 🚨 ACTIVE ENFORCEMENT
