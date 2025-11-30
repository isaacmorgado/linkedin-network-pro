# 🚀 Claude Agent Quick Reference

## Installation & Setup

```bash
# Install SDK
npm install @anthropic-ai/claude-agent-sdk

# Install CLI (optional but recommended)
npm install -g @anthropic-ai/claude-code

# Set API key
export ANTHROPIC_API_KEY='sk-ant-...'

# Initialize project
mkdir my-agent && cd my-agent
npm init -y
```

## Common Commands (Ken's Favorites)

### Project Setup
```bash
# Quick project scaffold
npm create vite@latest my-app -- --template react-ts
cd my-app
npm install

# Add agent SDK
npm install @anthropic-ai/claude-agent-sdk

# Start dev environment
npm run dev
```

### Agent Development
```bash
# Run agent interactively
npx claude-agent

# Run specific task
npx claude-agent run "implement feature X"

# Test your agent
npx claude-agent test

# Watch mode for development
npx tsx watch src/agent.ts
```

### Git Workflow
```bash
# Check status
git status

# Stage changes
git add .

# Commit (let agent write message)
git diff --staged
# Then use agent: "Write a commit message for these changes"

# Push
git push origin main

# Create PR (with agent)
# Agent: "Create a PR for current branch"
```

### Testing
```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Specific test
npm test -- user.test.ts
```

### Debugging
```bash
# Check logs
tail -f logs/agent.log

# Run with debug output
DEBUG=* npm run dev

# Check build
npm run build

# Type check
npx tsc --noEmit
```

### Common Agent Patterns

#### Pattern 1: Research Then Build
```bash
# Use agent to research first
"Research best practices for implementing auth in Next.js 14"

# Then implement
"Implement the auth solution following those best practices"
```

#### Pattern 2: Parallel Tasks
```bash
# Run multiple subagents in parallel
"Use researcher to find React patterns while coder sets up the project structure"
```

#### Pattern 3: Iterative Refinement
```bash
# Build incrementally
"Create basic component"
→ Test it
→ "Add error handling"
→ Test again
→ "Add loading states"
→ Test final
```

#### Pattern 4: Review Before Commit
```bash
# Always review with agent
"Review the changes I'm about to commit for potential issues"
→ Fix any problems
→ "Create a commit with these changes"
```

## File Structure Best Practices

```
my-agent/
├── .claude/
│   ├── agents/           # Custom subagents
│   │   ├── researcher.md
│   │   ├── coder.md
│   │   └── reviewer.md
│   ├── commands/         # Slash commands
│   │   └── deploy.md
│   └── skills/          # Reusable skills
│       └── testing.md
├── src/
│   ├── agents/          # Agent definitions
│   │   └── main.ts
│   ├── tools/           # Custom tools
│   │   └── sentiment.ts
│   └── index.ts         # Entry point
├── tests/               # Test files
├── logs/                # Agent logs
├── CLAUDE.md            # Project context
├── package.json
└── tsconfig.json
```

## Essential CLAUDE.md Sections

```markdown
# Project Name

## What This Is
[One paragraph description]

## Tech Stack
- Language: TypeScript
- Framework: [React/Node/etc]
- Database: [PostgreSQL/etc]
- Key Libraries: [list]

## Development Commands
[List all npm scripts]

## File Structure
[Explain where things go]

## Important Rules
- [Rule 1]
- [Rule 2]

## Known Issues
[List with workarounds]
```

## Custom Tool Template

```typescript
import { Tool } from '@anthropic-ai/claude-agent-sdk';

export const myTool = new Tool({
  name: 'my_tool_name',
  description: 'Clear description of what it does',
  parameters: {
    param1: {
      type: 'string',
      description: 'What this param is for',
      required: true
    },
    param2: {
      type: 'number',
      description: 'Optional param',
      required: false
    }
  },
  execute: async ({ param1, param2 }) => {
    // Your logic here
    return { result: 'success' };
  }
});
```

## Subagent Template

```markdown
---
name: agent-name
description: Brief description (shown in agent list)
tools: [read, write, bash, grep]
model: claude-sonnet-4-20250514
---

# Agent Name

You are [role]. Your purpose is to [purpose].

## Your Approach
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Best Practices
- [Practice 1]
- [Practice 2]

## Output Format
[How you should format responses]
```

## MCP Server Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem"],
      "env": {
        "ALLOWED_PATHS": "/home/user/projects"
      }
    }
  }
}
```

## Common MCP Servers

```bash
# GitHub integration
npx -y @modelcontextprotocol/server-github

# Filesystem access
npx -y @modelcontextprotocol/server-filesystem

# PostgreSQL
npx -y @modelcontextprotocol/server-postgres

# Slack
npx -y @modelcontextprotocol/server-slack

# Puppeteer (web scraping)
npx -y @modelcontextprotocol/server-puppeteer
```

## Debugging Tips

### Agent Not Working?
```bash
# Check API key
echo $ANTHROPIC_API_KEY

# Check for errors
cat logs/agent.log

# Verify installation
npm list @anthropic-ai/claude-agent-sdk

# Clear cache
rm -rf node_modules && npm install
```

### Agent Doing Wrong Thing?
1. Check CLAUDE.md - is context clear?
2. Review system prompt - is it specific enough?
3. Add "IMPORTANT:" to critical instructions
4. Use subagents for complex tasks
5. Add verification steps

### Context Overflow?
1. Use subagents to split tasks
2. Add compaction strategies
3. Clear chat history
4. Be more specific in prompts

## Performance Tips

```typescript
// Good: Specific tools
tools: ['read', 'write', 'grep']

// Bad: Too permissive
tools: ['*']

// Good: Parallel subagents
await Promise.all([
  agent1.run(task1),
  agent2.run(task2)
]);

// Bad: Sequential when unnecessary
await agent1.run(task1);
await agent2.run(task2);

// Good: Clear, specific prompts
"Implement JWT auth with refresh tokens following RFC 6749"

// Bad: Vague prompts
"Add authentication"
```

## Common Gotchas

1. **Forgot to set ANTHROPIC_API_KEY** → `export ANTHROPIC_API_KEY='...'`
2. **CLAUDE.md not loading** → Must configure source settings
3. **Agent ignoring instructions** → Add "IMPORTANT:" or "YOU MUST"
4. **Context overflow** → Use subagents or compaction
5. **Slow responses** → Use Haiku model for simple tasks
6. **Tools not working** → Check permissions and tool names

## Quick Tests

```typescript
// Test your agent quickly
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  name: 'TestAgent',
  tools: ['bash']
});

// Simple test
const result = await agent.run('echo "Hello World"');
console.log(result); // Should see "Hello World"
```

## Resources

- **Docs**: https://platform.claude.com/docs/en/api/agent-sdk
- **Examples**: https://github.com/anthropics/claude-agent-sdk
- **MCP Servers**: https://github.com/modelcontextprotocol/servers
- **Community**: https://claudelog.com
- **Discord**: https://discord.gg/anthropic

---

**Remember**: Start simple, iterate based on failures, test everything! 🚀
