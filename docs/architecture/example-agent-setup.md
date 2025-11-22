# Building Your Own Custom Agent - Complete Guide

## 🚀 Quick Start

### Installation

```bash
# Create your project directory
mkdir my-custom-agent
cd my-custom-agent

# Install Claude Agent SDK
npm install @anthropic-ai/claude-agent-sdk

# Set up authentication
export ANTHROPIC_API_KEY='your-api-key-from-console.anthropic.com'
```

### Basic Agent Code (TypeScript)

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

// Create your agent
const agent = new Agent({
  name: 'MyAgent',
  model: 'claude-sonnet-4-20250514',
  systemPrompt: `You are a helpful assistant specialized in [YOUR DOMAIN].

  Your key traits:
  - [Trait 1]
  - [Trait 2]
  - [Trait 3]

  Always approach problems by:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]`,

  // Configure tools
  tools: ['bash', 'read', 'write', 'grep', 'glob'],

  // Optional: MCP integration
  mcpServers: {
    // Add your MCP servers here
  }
});

// Run the agent
async function main() {
  const result = await agent.run('Your task here');
  console.log(result);
}

main();
```

### Python Version

```python
from claude_agent_sdk import Agent

agent = Agent(
    name="MyAgent",
    model="claude-sonnet-4-20250514",
    system_prompt="""You are a helpful assistant specialized in [YOUR DOMAIN].

    Your key traits:
    - [Trait 1]
    - [Trait 2]
    - [Trait 3]""",
    tools=['bash', 'read', 'write', 'grep', 'glob']
)

# Run the agent
result = agent.run("Your task here")
print(result)
```

## 📝 Creating CLAUDE.md (Project Memory)

Create a `CLAUDE.md` file in your project root:

```markdown
# Project Context

## What This Project Does
[Describe your project]

## Architecture
[Explain your architecture]

## Development Guidelines
- Always run tests before committing
- Use TypeScript for type safety
- Follow the existing code style

## Important Files
- `src/main.ts` - Entry point
- `src/config/` - Configuration files
- `tests/` - Test suites

## Common Commands
```bash
npm run dev      # Start development server
npm test         # Run tests
npm run build    # Build for production
```

## Known Issues
- [Issue 1 and workaround]
- [Issue 2 and workaround]
```

## 🎭 Creating Custom Subagents

Create `.claude/agents/my-specialist.md`:

```markdown
---
name: my-specialist
description: Specialized agent for [specific task]
tools: [bash, read, write, grep]
model: claude-sonnet-4-20250514
---

You are a specialist in [DOMAIN]. Your primary role is to [PURPOSE].

## Your Expertise
- [Skill 1]
- [Skill 2]
- [Skill 3]

## Approach
1. First, [step 1]
2. Then, [step 2]
3. Finally, [step 3]

## Best Practices
- Always [practice 1]
- Never [anti-pattern]
- Prefer [approach] over [alternative]

## Output Format
When complete, provide:
- Summary of findings
- Recommendations
- Next steps
```

## 🔧 Adding MCP Tools

### Example: GitHub Search MCP

```json
{
  "mcpServers": {
    "github-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "your-github-token"
      }
    }
  }
}
```

### Example: Database MCP

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

## 🎯 Ken Wheeler's Common Patterns

Based on his open source work, here are common patterns:

### 1. **Tool-First Approach**
Give agents specific, well-defined tools rather than broad permissions:

```typescript
// Good
tools: ['bash', 'read', 'write']

// Better - with restrictions
allowedTools: ['bash', 'read'],
permissionMode: 'strict'
```

### 2. **Iterative Feedback Loop**
```typescript
const agent = new Agent({
  systemPrompt: `
    After each action:
    1. Verify the result
    2. Check for errors
    3. Iterate if needed
    4. Only mark complete when verified
  `
});
```

### 3. **Context Management**
```typescript
// Use subagents for parallel tasks
const researcher = agent.createSubagent('researcher');
const coder = agent.createSubagent('coder');

// They work independently with separate contexts
await Promise.all([
  researcher.run('Research API patterns'),
  coder.run('Implement the API')
]);
```

### 4. **Test-Driven Agent Development**
```typescript
// Build test sets for your agents
const testCases = [
  { input: 'Task 1', expected: 'Outcome 1' },
  { input: 'Task 2', expected: 'Outcome 2' },
];

for (const test of testCases) {
  const result = await agent.run(test.input);
  assert(result.includes(test.expected));
}
```

## 🔥 Advanced Patterns

### Custom Tool Creation

```typescript
import { Tool } from '@anthropic-ai/claude-agent-sdk';

const customTool = new Tool({
  name: 'analyze_sentiment',
  description: 'Analyzes sentiment of text',
  parameters: {
    text: { type: 'string', description: 'Text to analyze' }
  },
  execute: async ({ text }) => {
    // Your custom logic here
    return { sentiment: 'positive', score: 0.85 };
  }
});

const agent = new Agent({
  tools: [customTool, 'bash', 'read']
});
```

### Agent Composition

```typescript
// Main agent that delegates to specialists
const mainAgent = new Agent({
  name: 'Orchestrator',
  systemPrompt: `
    You coordinate multiple specialist agents:
    - Use 'researcher' for gathering information
    - Use 'coder' for implementation
    - Use 'reviewer' for quality checks
  `,
  subagents: [researcherAgent, coderAgent, reviewerAgent]
});
```

## 📚 Essential Resources

1. **Official Docs**: https://platform.claude.com/docs/en/api/agent-sdk
2. **Examples**: https://github.com/anthropics/claude-agent-sdk/examples
3. **MCP Servers**: https://github.com/modelcontextprotocol/servers
4. **ClaudeLog**: https://claudelog.com (community guides)

## 🎓 What You Need to Know to Build Anything

### Core Concepts
1. **System Prompts** - Define agent personality and behavior
2. **Tools** - Enable agent capabilities (file ops, bash, search, etc.)
3. **Context Management** - Keep agents focused and efficient
4. **MCP Protocol** - Extend with custom integrations
5. **Subagents** - Parallel processing and specialized tasks

### Development Workflow
```bash
# 1. Define your agent's purpose
# 2. Write system prompt in CLAUDE.md
# 3. Configure tools and MCPs
# 4. Test with simple tasks
# 5. Iterate based on failures
# 6. Build test suite
# 7. Deploy and monitor
```

### Key Commands

```bash
# Start agent in interactive mode
npx claude-agent

# Run specific task
npx claude-agent run "your task"

# Test your agent
npx claude-agent test

# Deploy
npx claude-agent deploy
```

## 🚨 Common Pitfalls

1. **Too Vague System Prompts** - Be specific!
2. **No Verification Step** - Always verify results
3. **Context Overflow** - Use subagents for large tasks
4. **Missing Test Cases** - Build comprehensive tests
5. **Over-Permissioned** - Restrict tools to what's needed

## 💡 Pro Tips

1. Use `IMPORTANT:` and `YOU MUST` in prompts for critical instructions
2. Run CLAUDE.md through prompt improver periodically
3. Start with agentic search before adding semantic search
4. Use rules-based validation over LLM evaluation when possible
5. Build representative test sets to catch regressions
6. Monitor agent failures to identify missing tools

---

*Happy Agent Building! 🤖*
