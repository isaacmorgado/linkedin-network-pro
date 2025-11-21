# Form Detection Test Guide

**Status**: ✅ **FormDetector Built** - Ready for Testing
**Goal**: Validate 90%+ accuracy before proceeding with UI

---

## 📋 Quick Start

### **Option 1: Test on Real Job Sites** (Recommended)

1. **Build the extension:**
   ```bash
   npm run dev
   ```

2. **Load extension in Chrome:**
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `.output/chrome-mv3` directory

3. **Navigate to a job application:**
   - Open one of the test URLs below
   - Fill out at least the first page

4. **Run the test:**
   - Open browser console (F12)
   - Run: `testFormDetection()`
   - Review the detection results

5. **Validate accuracy:**
   - Run: `validateAccuracy()`
   - Visually inspect each highlighted field
   - Run: `markCorrect([0, 1, 2, ...])`  for correct detections
   - Run: `markIncorrect([3, 4, ...])`  for incorrect detections
   - Run: `calculateAccuracy()`  to get final percentage

---

### **Option 2: Test on Local HTML Page** (Quick)

1. **Open the test page:**
   ```bash
   open test-form-detection-local.html
   ```

2. **Load extension** (same as above)

3. **Run test in console:**
   ```javascript
   testFormDetection()
   ```

---

## 🎯 Test URLs (Real Job Applications)

### **Greenhouse** (Most Common)
```
https://boards.greenhouse.io/anthropic/jobs/4009518008
https://boards.greenhouse.io/stripe/jobs/5933428
https://boards.greenhouse.io/reddit/jobs/5869750
```

### **Lever**
```
https://jobs.lever.co/netflix/...
https://jobs.lever.co/spotify/...
```

### **Workday**
```
https://amazon.jobs/en/jobs/...
https://careers.google.com/jobs/...
```

### **Indeed**
```
https://www.indeed.com/viewjob?jk=...
```

### **Native Sites**
```
https://www.metacareers.com/jobs/...
https://jobs.netflix.com/jobs/...
```

---

## 📊 Expected Results

### **High-Confidence Fields (≥80%)**

Should detect:
- ✅ First Name
- ✅ Last Name
- ✅ Email
- ✅ Phone
- ✅ Location
- ✅ Resume Upload
- ✅ Cover Letter

### **Medium-Confidence Fields (50-79%)**

May detect:
- 🟡 Skills (if explicitly labeled)
- 🟡 Work Authorization
- 🟡 Questions (essay fields)

### **Low-Confidence Fields (< 50%)**

Unlikely to detect:
- 🟠 Custom fields
- 🟠 Company-specific questions
- 🟠 Unlabeled dropdowns

---

## ✅ Success Criteria

**Ready to proceed if:**
- ✅ Detects ≥90% of name/email/phone fields correctly
- ✅ Detects ≥80% of resume upload fields
- ✅ Detects ≥70% of location/skills fields
- ✅ No false positives on submit buttons
- ✅ Works across 3+ different ATS systems

**Needs improvement if:**
- ❌ Accuracy < 80% on basic fields (name, email, phone)
- ❌ Many false positives (classifying wrong fields)
- ❌ Fails to detect resume upload on most sites

---

## 🔧 Debugging

### **View Debug Summary**

```javascript
const result = testFormDetection();
console.log(result.getDebugSummary());
```

### **Inspect Specific Field**

```javascript
const result = testFormDetection();
const emailField = result.fields.find(f => f.type === 'email');
console.log('Email field:', emailField);
console.log('Element:', emailField.element);
console.log('Debug info:', emailField.debugInfo);
```

### **Test Dynamic Forms**

```javascript
// Start observing for new fields
const detector = new FormDetector();
detector.startObserving((result) => {
  console.log('Form changed! New fields:', result.fields.length);
});

// Click "Next" or load more fields
// Observer will automatically detect new fields
```

---

## 📈 Accuracy Tracking

After testing on 10+ sites, record results:

| Site | ATS | Total Fields | Correct | Accuracy |
|------|-----|--------------|---------|----------|
| Anthropic | Greenhouse | 15 | 14 | 93.3% |
| Stripe | Greenhouse | 12 | 11 | 91.7% |
| Netflix | Lever | 18 | 15 | 83.3% |
| ... | ... | ... | ... | ... |

**Average Accuracy Target: ≥90%**

---

## 🐛 Common Issues

### **Issue 1: Not detecting resume upload**
- **Cause:** File input has custom styling/wrapper
- **Fix:** Add more patterns to `RESUME_UPLOAD` in form-detector.ts

### **Issue 2: Detecting submit button as field**
- **Cause:** Pattern too broad
- **Fix:** Exclude `type="submit"` in querySelector

### **Issue 3: Low confidence on clear fields**
- **Cause:** Unusual naming convention
- **Fix:** Add ATS-specific patterns

---

## 🚀 Next Steps After Validation

**If accuracy ≥90%:**
1. ✅ Mark Phase 2 complete
2. ✅ Proceed to Phase 3 (Storage Layer)
3. ✅ Build autofill logic

**If accuracy 80-89%:**
1. 🔧 Improve pattern matching
2. 🔧 Add more test cases
3. 🔧 Re-test until ≥90%

**If accuracy <80%:**
1. ❌ Reassess approach
2. ❌ Consider manual field selection UI
3. ❌ Test on simpler forms first

---

## 💡 Tips

1. **Test incrementally:** Start with Greenhouse (most standardized)
2. **Check edge cases:** Multi-page forms, dynamic fields, iframes
3. **Verify on mobile:** Some sites have different mobile forms
4. **Test with ad blockers:** Some extensions interfere with detection
5. **Clear cache:** Old form data can affect results

---

**Last Updated:** November 21, 2025
**Status:** Ready for Testing
**Estimated Testing Time:** 2-3 hours for 10+ sites
