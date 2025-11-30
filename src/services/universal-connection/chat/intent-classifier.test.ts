/**
 * Intent Classifier Tests
 * Validates intent classification and entity extraction
 */

import { describe, it, expect } from 'vitest';
import { classifyIntent } from './intent-classifier';

describe('Intent Classifier', () => {
  // ========================================================================
  // Category 1: SEARCH Intent (6 tests)
  // ========================================================================

  describe('SEARCH Intent', () => {
    it('should classify basic search: "Who are the HR reps at Netflix?"', async () => {
      const result = await classifyIntent('Who are the HR reps at Netflix?');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Netflix');
      expect(result.entities.query).toBeTruthy();
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning).toContain('search intent');
    });

    it('should classify role-based search: "Show me senior engineers"', async () => {
      const result = await classifyIntent('Show me senior engineers');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.role).toBe('senior');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify location filter: "Find designers in SF"', async () => {
      const result = await classifyIntent('Find designers in SF');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.location).toBe('SF');
      expect(result.entities.query).toContain('designer');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify connection degree: "List my 2nd degree connections at Google"', async () => {
      const result = await classifyIntent('List my 2nd degree connections at Google');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.connectionDegree).toEqual([2]);
      expect(result.entities.company).toBe('Google');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify multiple filters: "Senior engineers at Meta in NYC with 5+ years"', async () => {
      const result = await classifyIntent('Senior engineers at Meta in NYC with 5+ years');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.role).toBe('senior');
      expect(result.entities.company).toBe('Meta');
      expect(result.entities.location).toBe('NYC');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle edge case: empty query after filter extraction', async () => {
      const result = await classifyIntent('People at Netflix');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Netflix');
      // Query might be empty or minimal after extracting "people" and company
      expect(result.reasoning).toContain('search intent');
    });
  });

  // ========================================================================
  // Category 2: FIND_PATH Intent (6 tests)
  // ========================================================================

  describe('FIND_PATH Intent', () => {
    it('should classify basic path: "How can I reach John Doe?"', async () => {
      const result = await classifyIntent('How can I reach John Doe?');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toContain('John');
      expect(result.entities.target).toContain('Doe');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning).toContain('path-finding intent');
    });

    it('should classify introduction: "Introduce me to Jane Smith"', async () => {
      const result = await classifyIntent('Introduce me to Jane Smith');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toContain('Jane');
      expect(result.entities.target).toContain('Smith');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify company context: "Path to someone at Netflix"', async () => {
      const result = await classifyIntent('Path to someone at Netflix');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.targetCompany).toBe('Netflix');
      expect(result.reasoning).toContain('path-finding intent');
    });

    it('should classify multiple names: "Connect me to John Doe or Jane Smith"', async () => {
      const result = await classifyIntent('Connect me to John Doe or Jane Smith');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toBeTruthy();
      // Should capture at least one of the names
      const target = result.entities.target || '';
      const hasJohn = target.includes('John');
      const hasJane = target.includes('Jane');
      expect(hasJohn || hasJane).toBe(true);
    });

    it('should handle mixed case: "how do i reach JOHN DOE"', async () => {
      const result = await classifyIntent('how do i reach JOHN DOE');

      expect(result.type).toBe('FIND_PATH');
      // Proper noun detection should work with all caps
      expect(result.reasoning).toContain('path-finding intent');
    });

    it('should handle edge case: no proper noun found', async () => {
      const result = await classifyIntent('How can I reach someone interesting?');

      expect(result.type).toBe('FIND_PATH');
      // No target extracted, but intent is still FIND_PATH
      expect(result.reasoning).toContain('path-finding intent');
    });
  });

  // ========================================================================
  // Category 3: GENERATE_MESSAGE Intent (6 tests)
  // ========================================================================

  describe('GENERATE_MESSAGE Intent', () => {
    it('should classify basic draft: "Draft a message to Jane Smith"', async () => {
      const result = await classifyIntent('Draft a message to Jane Smith');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.entities.target).toContain('Jane');
      expect(result.entities.target).toContain('Smith');
      expect(result.confidence).toBeGreaterThan(0.6);
      expect(result.reasoning).toContain('message generation intent');
    });

    it('should classify context reference: "Write an email to the first result"', async () => {
      const result = await classifyIntent('Write an email to the first result');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.entities.contextReference).toContain('first result');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should classify multiple recipients: "Generate message for John and Sarah"', async () => {
      const result = await classifyIntent('Generate message for John and Sarah');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.entities.target).toBeTruthy();
      expect(result.reasoning).toContain('message generation intent');
    });

    it('should classify outreach: "Help me reach out to recruiters at Google"', async () => {
      const result = await classifyIntent('Help me reach out to recruiters at Google');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.reasoning).toContain('message generation intent');
    });

    it('should classify combined action: "Draft intro message to connect with Jane"', async () => {
      const result = await classifyIntent('Draft intro message to connect with Jane');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.entities.target).toContain('Jane');
      expect(result.confidence).toBeGreaterThan(0.6);
    });

    it('should handle edge case: no recipient specified', async () => {
      const result = await classifyIntent('Draft a message');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.reasoning).toContain('message generation intent');
      expect(result.reasoning).toContain('no recipient specified');
    });
  });

  // ========================================================================
  // Category 4: GENERAL Intent (4 tests)
  // ========================================================================

  describe('GENERAL Intent', () => {
    it('should classify greeting: "Hello! How can you help?"', async () => {
      const result = await classifyIntent('Hello! How can you help?');

      expect(result.type).toBe('GENERAL');
      expect(result.reasoning).toContain('General query');
    });

    it('should classify system question: "What can you do?"', async () => {
      const result = await classifyIntent('What can you do?');

      expect(result.type).toBe('GENERAL');
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should classify context reference: "Tell me more about that"', async () => {
      const result = await classifyIntent('Tell me more about that');

      expect(result.type).toBe('GENERAL');
      expect(result.entities.contextReference).toContain('that');
    });

    it('should classify acknowledgment: "Thanks for the help!"', async () => {
      const result = await classifyIntent('Thanks for the help!');

      expect(result.type).toBe('GENERAL');
      expect(result.reasoning).toContain('General query');
    });
  });

  // ========================================================================
  // Category 5: Edge Cases (6 tests)
  // ========================================================================

  describe('Edge Cases', () => {
    it('should handle empty message', async () => {
      const result = await classifyIntent('');

      expect(result.type).toBe('GENERAL');
      expect(result.reasoning).toContain('Empty message');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should handle very long message (>500 chars)', async () => {
      const longMessage = 'Who are the senior software engineers at Netflix with 5+ years of experience in cloud computing and distributed systems who are also interested in machine learning and artificial intelligence and have worked on large-scale data processing systems and are based in the San Francisco Bay Area or Seattle and have experience with Python, Java, and Go and are currently working on infrastructure or platform teams and have previously worked at other top tech companies like Google, Amazon, or Microsoft and are active on LinkedIn and frequently post about technology trends?';

      const result = await classifyIntent(longMessage);

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Netflix');
      expect(result.entities.role).toBe('senior');
    });

    it('should handle multi-intent: "Find engineers and introduce me to the best"', async () => {
      const result = await classifyIntent('Find engineers and introduce me to the best');

      // Should prioritize SEARCH (first action)
      expect(result.type).toBe('SEARCH');
      expect(result.entities.query).toContain('engineer');
    });

    it('should handle typos: "Who r the engneers at Gogle?"', async () => {
      const result = await classifyIntent('Who r the engneers at Gogle?');

      // Should still detect SEARCH intent despite typos
      expect(result.type).toBe('SEARCH');
      expect(result.entities.query).toBeTruthy();
      // Company name extraction may be affected by typo, but intent should be correct
    });

    it('should handle all lowercase: "find people at netflix"', async () => {
      const result = await classifyIntent('find people at netflix');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Netflix');
    });

    it('should handle special characters: "Who are the @Netflix #engineers?"', async () => {
      const result = await classifyIntent('Who are the @Netflix #engineers?');

      expect(result.type).toBe('SEARCH');
      // Should still detect search intent
      expect(result.reasoning).toContain('search intent');
    });
  });

  // ========================================================================
  // Category 6: Confidence Scoring (2 tests)
  // ========================================================================

  describe('Confidence Scoring', () => {
    it('should have high confidence with clear keywords + entities', async () => {
      const result = await classifyIntent('Who are the senior engineers at Google in San Francisco?');

      expect(result.type).toBe('SEARCH');
      expect(result.confidence).toBeGreaterThan(0.75);
      expect(result.reasoning).toContain('high');
    });

    it('should have low confidence with ambiguous or missing entities', async () => {
      const result = await classifyIntent('What about them?');

      expect(result.type).toBe('GENERAL');
      expect(result.confidence).toBeLessThan(0.6);
      expect(result.reasoning).toMatch(/low|medium/);
    });
  });

  // ========================================================================
  // Category 7: Ambiguous Cases (Overlapping Keywords)
  // ========================================================================

  describe('Ambiguous Cases', () => {
    it('should prioritize FIND_PATH over SEARCH when proper nouns exist: "Show me how to reach John Doe"', async () => {
      const result = await classifyIntent('Show me how to reach John Doe');

      // "Show me" → SEARCH keyword, but "how to reach [Name]" → FIND_PATH should win
      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toContain('John');
      expect(result.reasoning).toContain('path-finding intent');
    });

    it('should handle context-dependent message: "Draft a message to them"', async () => {
      const result = await classifyIntent('Draft a message to them');

      expect(result.type).toBe('GENERATE_MESSAGE');
      // Should capture context reference
      expect(result.reasoning).toContain('message generation intent');
    });

    it('should classify plural job titles as SEARCH: "engineers at Google"', async () => {
      const result = await classifyIntent('engineers at Google');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Google');
    });

    it('should classify singular person request as FIND_PATH: "engineer named John Doe"', async () => {
      const result = await classifyIntent('How can I reach the engineer named John Doe?');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toContain('John');
    });
  });

  // ========================================================================
  // Category 8: Additional Keyword Pattern Tests
  // ========================================================================

  describe('Keyword Pattern Validation', () => {
    it('should detect "looking for" as SEARCH trigger', async () => {
      const result = await classifyIntent('Looking for product managers');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.query).toBeTruthy();
    });

    it('should detect "get in touch with" as FIND_PATH trigger', async () => {
      const result = await classifyIntent('How do I get in touch with Sarah Johnson?');

      expect(result.type).toBe('FIND_PATH');
      expect(result.entities.target).toContain('Sarah');
    });

    it('should detect "compose" as GENERATE_MESSAGE trigger', async () => {
      const result = await classifyIntent('Compose an email to the hiring manager');

      expect(result.type).toBe('GENERATE_MESSAGE');
      expect(result.reasoning).toContain('message generation intent');
    });

    it('should detect "what people" as SEARCH trigger', async () => {
      const result = await classifyIntent('What people work at Apple?');

      expect(result.type).toBe('SEARCH');
      expect(result.entities.company).toBe('Apple');
    });
  });
});
