// Minimal Agent Example - Get Started in 5 Minutes
// Run: npx tsx minimal-example.ts

import { Agent } from '@anthropic-ai/claude-agent-sdk';

// 1. Create your agent with a personality
const myAgent = new Agent({
  name: 'DevHelper',
  model: 'claude-sonnet-4-20250514',

  // This is where the magic happens - define WHO your agent is
  systemPrompt: `You are DevHelper, a friendly coding assistant.

  Your style:
  - Concise and helpful
  - Always explain WHY, not just HOW
  - Suggest best practices
  - Write clean, documented code

  When solving problems:
  1. Understand the requirement fully
  2. Plan the approach
  3. Implement with tests
  4. Verify it works
  `,

  // Give your agent capabilities
  tools: [
    'bash',      // Execute commands
    'read',      // Read files
    'write',     // Write files
    'grep',      // Search code
    'glob',      // Find files
    'web_search' // Search the web
  ],

  // Optional: Configure permissions
  permissionMode: 'ask', // 'allow', 'ask', or 'deny'
});

// 2. Use your agent
async function main() {
  try {
    // Simple task
    const result = await myAgent.run(
      'Create a hello world TypeScript function with tests'
    );

    console.log('Agent completed:', result);

    // Complex task with context
    const analysis = await myAgent.run(
      'Analyze the codebase and suggest improvements',
      {
        context: {
          projectType: 'web-app',
          language: 'TypeScript',
          framework: 'React'
        }
      }
    );

    console.log('Analysis:', analysis);

  } catch (error) {
    console.error('Agent error:', error);
  }
}

// Run it!
main();

// 3. With Subagents for Complex Tasks
async function complexWorkflow() {
  // Create specialized subagents
  const researcher = myAgent.createSubagent('researcher', {
    systemPrompt: 'You research and gather information thoroughly.',
    tools: ['web_search', 'read']
  });

  const coder = myAgent.createSubagent('coder', {
    systemPrompt: 'You write clean, tested code.',
    tools: ['write', 'bash']
  });

  // Run in parallel
  const [research, implementation] = await Promise.all([
    researcher.run('Research best practices for React state management'),
    coder.run('Set up the project structure')
  ]);

  console.log('Research:', research);
  console.log('Implementation:', implementation);
}

// 4. With Custom Tools
import { Tool } from '@anthropic-ai/claude-agent-sdk';

const sentimentTool = new Tool({
  name: 'analyze_sentiment',
  description: 'Analyzes the sentiment of text',
  parameters: {
    text: { type: 'string', description: 'The text to analyze' }
  },
  execute: async ({ text }: { text: string }) => {
    // Your custom logic
    const words = text.toLowerCase().split(' ');
    const positiveWords = ['good', 'great', 'excellent', 'amazing'];
    const negativeWords = ['bad', 'terrible', 'awful', 'poor'];

    const positiveCount = words.filter(w => positiveWords.includes(w)).length;
    const negativeCount = words.filter(w => negativeWords.includes(w)).length;

    return {
      sentiment: positiveCount > negativeCount ? 'positive' : 'negative',
      score: (positiveCount - negativeCount) / words.length
    };
  }
});

const agentWithCustomTool = new Agent({
  name: 'SentimentAnalyzer',
  tools: [sentimentTool]
});

// Export for use
export { myAgent, complexWorkflow, agentWithCustomTool };
