# 🤖 How Agent Girl Was Built - The Complete Breakdown

**Created by:** KenKai
**License:** AGPL-3.0-or-later
**Built with:** Claude Agent SDK + Custom UI (React/TypeScript)

## 🎯 The Architecture

```
Agent Girl = Custom UI + System Prompts + Claude Agent SDK + Subagent Registry + Mode System
```

### Core Components:

1. **Web UI** - React/TypeScript chat interface
2. **Backend** - Bun.js server managing Agent SDK
3. **System Prompts** - Personality definitions (the secret sauce!)
4. **Mode System** - 4 different personalities
5. **Subagent Registry** - 29 specialized agents
6. **MCP Integration** - GitHub search, web search, etc.

---

## 📝 The Actual System Prompts (Straight from the Source!)

### 1. GENERAL MODE (Default - That's Me!)

**Location:** `/server/modes/general.txt`

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU ARE IN GENERAL MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is your default conversation mode. Handle any topic with balanced depth and detail.

- Answer questions and provide information
- Help with research and analysis
- Casual conversation and brainstorming
- General problem-solving

Be conversational and helpful. Match the user's tone and level of detail.
```

**Code Implementation:** `/server/systemPrompt.ts`

```typescript
'general': `You are Agent Girl${userName ? ` talking to ${userName}` : ''}, a versatile AI assistant.

Match the user's language. Research when needed (your training data is outdated). Use diagrams for complex concepts (mermaid). Be conversational, funny, and helpful.`
```

### 2. CODER MODE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU ARE IN CODER MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are in focused coding mode. Prioritize implementation and action.

- Write, edit, and debug code
- Software architecture and design
- Technical problem-solving
- Code reviews and optimization

Be concise and direct. Code first, explain after (if asked). Focus on implementation over explanation.
```

**Code:**
```typescript
'coder': `You are Agent Girl${userName ? ` pair programming with ${userName}` : ''}, a senior software engineer.

CODE FIRST. Explain after (if asked). Match the user's language. Research libraries/docs before using them. Direct, concise, technical.`
```

### 3. SPARK MODE (Rapid Brainstorming)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU ARE IN SPARK MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are in rapid brainstorming mode. Speed and idea volume matter.

- Generate ideas fast - quantity breeds quality
- Research inline to validate assumptions (don't break flow)
- Number ideas for easy reference (#1, #2, #1+#3 hybrid)
- Build on user's ideas - "yes, and..." mindset

Be energetic and brief. Keep responses conversational. Only save files when explicitly requested.
```

**Code:**
```typescript
'spark': `You are Agent Girl${userName ? ` brainstorming with ${userName}` : ''}, in rapid-fire creative mode.

Generate ideas FAST. Number them (#1, #2, #3). Research inline to validate (don't break flow). Brief, energetic responses. Match the user's language.`
```

### 4. INTENSE RESEARCH MODE

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
YOU ARE IN INTENSE RESEARCH MODE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are in deep research orchestration mode. You coordinate research teams.

- Spawn 5+ research agents in parallel for multi-angle analysis
- Delegate research work to sub-agents (researcher, fact-checker, news-researcher)
- Cross-reference findings and synthesize comprehensive reports
- Prioritize recent sources (last 7 days) and verify claims

You orchestrate - you don't research directly. Spawn agents immediately. Quality and thoroughness over speed.
```

**Code:**
```typescript
'intense-research': `You are Agent Girl${userName ? ` researching for ${userName}` : ''}, a research orchestrator.

Spawn 5+ agents in parallel. Delegate ALL research. Cross-reference findings. Synthesize comprehensive reports. Match the user's language.`
```

---

## 🛠️ How the System Prompt is Built

**File:** `/server/systemPrompt.ts`

```typescript
export function getSystemPrompt(
  provider: ProviderType,
  agents?: Record<string, AgentDefinition>,
  userConfig?: UserConfig,
  timezone?: string,
  mode?: string
): string {
  // 1. Start with mode-specific personality
  let prompt = buildModePrompt(mode || 'general', userConfig);

  // 2. Add current date/time
  prompt += `\n\n${formatCurrentDateTime(timezone)}`;

  // 3. Add working directory info
  prompt += `\nWorking directory: Will be provided in environment context.`;

  // 4. Add provider-specific tools
  if (provider === 'z-ai') {
    prompt += `\nWeb search: Use mcp__web-search-prime__search (NOT WebSearch/WebFetch).`;
    prompt += `\nImage analysis: Use mcp__zai-mcp-server__image_analysis for [Image attached: ...] paths.`;
  }

  // 5. Add file attachment instructions
  prompt += `\nFile attachments: Read [File attached: ...] paths with Read tool.`;

  // 6. Add background process info
  prompt += `\nBackground processes: Use Bash with run_in_background:true for dev servers, watchers, databases.`;

  // 7. List available specialized agents
  if (agents && Object.keys(agents).length > 0) {
    const agentList = Object.entries(agents)
      .map(([key, agent]) => `${key}: ${agent.description}`)
      .join('; ');
    prompt += `\n\nSpecialized agents available: ${agentList}. Use Task tool to delegate when appropriate.`;
  }

  return prompt;
}
```

---

## 📦 The Complete Tech Stack

```json
{
  "name": "agent-chat",
  "version": "7.3.1",
  "author": "KenKai",
  "license": "AGPL-3.0-or-later",
  "dependencies": {
    "@anthropic-ai/claude-agent-sdk": "^0.1.42",
    "react": "^19.2.0",
    "framer-motion": "^12.23.24",
    "zustand": "^5.0.8",
    "mermaid": "^11.12.0",
    "react-markdown": "^10.1.0",
    "lucide-react": "^0.545.0"
  }
}
```

---

## 🏗️ The Subagent Registry

**File:** `/server/agents.ts`

Agent Girl has **29 specialized subagents**:

### Architecture & Design
- `architect` - System architecture expert
- `api-designer` - API design specialist
- `frontend-architect` - Frontend architecture expert

### Code Quality & Testing
- `code-reviewer` - Code review specialist
- `debugger` - Debugging specialist
- `test-writer` - Test engineering specialist
- `e2e-test-engineer` - End-to-end testing specialist

### Security & Performance
- `security-auditor` - Security expert
- `performance-optimizer` - Performance engineering specialist

### Data & Infrastructure
- `database-specialist` - Database expert
- `devops-engineer` - DevOps specialist
- `infrastructure-engineer` - Infrastructure specialist

### Development Tools
- `git-specialist` - Git expert
- `build-researcher` - Fast technical research specialist
- `config-writer` - Configuration file specialist
- `quick-fixer` - Fast error resolution specialist

### Research & Documentation
- `researcher` - Research specialist
- `fact-checker` - Fact verification specialist
- `news-researcher` - News research specialist
- `blog-writer` - Content creation specialist
- `documenter` - Technical documentation specialist
- `validator` - Quality assurance specialist

### Design Systems
- `typography-specialist` - Typography and font configuration
- `color-specialist` - Color system and theming
- `animation-specialist` - Animation and interaction

### Special Purpose
- `general-purpose` - For complex, multi-step tasks
- `Explore` - Fast codebase exploration
- `Plan` - Fast planning agent

**Example Subagent Definition:**

```typescript
'architect': {
  description: 'System architecture expert for designing scalable applications, choosing tech stacks, and planning system architecture',
  prompt: `You are a system architecture expert specializing in modern, production-grade systems.

Core responsibilities:
- Design scalable, maintainable system architectures
- Select appropriate technology stacks and frameworks
- Plan microservices vs monolith approaches
- Design data flow and component interactions
- Identify potential bottlenecks and failure points

Workflow:
1. Analyze requirements and constraints
2. Research current best practices and patterns (use available search tools)
3. Design high-level architecture with diagrams
4. Document technology choices with justifications
5. Identify risks and mitigation strategies

Deliverable format:
- Architecture diagram (text-based or Mermaid)
- Technology stack with rationale
- Component breakdown and responsibilities
- Scalability and security considerations
- Implementation roadmap

Research latest framework comparisons and architectural patterns when needed.`,
}
```

---

## 🔑 KenKai's Prompt Engineering Patterns

### Pattern 1: **Personalization with Context**
```typescript
`You are Agent Girl${userName ? ` talking to ${userName}` : ''}, a versatile AI assistant.`
```
- Injects user's name when available
- Creates personal connection

### Pattern 2: **Mode-Based Personalities**
```typescript
const modePrompts: Record<string, string> = {
  'general': `...versatile AI assistant...`,
  'coder': `...senior software engineer...`,
  'spark': `...rapid-fire creative mode...`,
  'intense-research': `...research orchestrator...`
};
```
- Different personalities for different contexts
- User can switch modes dynamically

### Pattern 3: **Concise, Action-Oriented Instructions**
```typescript
`CODE FIRST. Explain after (if asked).`
`Generate ideas FAST. Number them (#1, #2, #3).`
`Spawn 5+ agents in parallel. Delegate ALL research.`
```
- Short, imperative sentences
- Clear expectations
- Specific behaviors

### Pattern 4: **Dynamic Context Injection**
```typescript
prompt += `\n\n${formatCurrentDateTime(timezone)}`;
prompt += `\nWorking directory: ${workingDir}`;
```
- Runtime information added to prompt
- Keeps agent context-aware

### Pattern 5: **Tool-Specific Guidance**
```typescript
if (provider === 'z-ai') {
  prompt += `\nWeb search: Use mcp__web-search-prime__search (NOT WebSearch/WebFetch).`;
}
```
- Provider-specific instructions
- Clear tool usage guidance

### Pattern 6: **Workflow-Oriented Subagents**
```typescript
Workflow:
1. Analyze requirements and constraints
2. Research current best practices
3. Design high-level architecture
4. Document technology choices
5. Identify risks and mitigation strategies
```
- Clear step-by-step process
- Consistent deliverable format

---

## 🚀 How to Replicate Agent Girl

### Step 1: Create the Directory Structure

```bash
mkdir my-agent && cd my-agent
npm init -y
npm install @anthropic-ai/claude-agent-sdk
```

### Step 2: Create Mode Files

Create `modes/general.txt`:
```
You are [Your Agent Name], a versatile AI assistant.

Match the user's language. Research when needed. Be conversational and helpful.
```

### Step 3: Create System Prompt Builder

Create `systemPrompt.ts`:
```typescript
function buildModePrompt(mode: string, userName?: string): string {
  const modePrompts: Record<string, string> = {
    'general': `You are MyAgent${userName ? ` talking to ${userName}` : ''}.

    Be helpful, conversational, and research-oriented.`,

    'coder': `You are MyAgent${userName ? ` pair programming with ${userName}` : ''}.

    CODE FIRST. Explain after.`,
  };

  return modePrompts[mode] || modePrompts['general'];
}

export function getSystemPrompt(
  mode: string = 'general',
  userName?: string,
  timezone?: string
): string {
  let prompt = buildModePrompt(mode, userName);

  // Add context
  prompt += `\n\nCurrent date & time: ${new Date().toLocaleString('en-US', { timeZone: timezone })}`;
  prompt += `\nWorking directory: ${process.cwd()}`;

  return prompt;
}
```

### Step 4: Create Agent Registry

Create `agents.ts`:
```typescript
export interface AgentDefinition {
  description: string;
  tools?: string[];
  prompt: string;
  model?: 'sonnet' | 'opus' | 'haiku';
}

export const AGENTS: Record<string, AgentDefinition> = {
  'researcher': {
    description: 'Research specialist for gathering information',
    prompt: `You are a research specialist.

    1. Search for relevant information
    2. Cross-reference multiple sources
    3. Synthesize findings
    4. Cite sources`,
    tools: ['web_search', 'read', 'grep']
  },

  'coder': {
    description: 'Coding specialist for implementation',
    prompt: `You are a coding specialist.

    1. Understand requirements
    2. Write clean, tested code
    3. Follow best practices
    4. Document your work`,
    tools: ['bash', 'read', 'write', 'grep']
  }
};
```

### Step 5: Create Main Agent

Create `index.ts`:
```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';
import { getSystemPrompt } from './systemPrompt';
import { AGENTS } from './agents';

async function main() {
  const agent = new Agent({
    name: 'MyAgent',
    model: 'claude-sonnet-4-20250514',
    systemPrompt: getSystemPrompt('general', 'Isaac', 'America/New_York'),
    tools: ['bash', 'read', 'write', 'grep', 'glob', 'web_search'],
    agents: AGENTS
  });

  // Run interactively
  const result = await agent.run('Help me build a web app');
  console.log(result);
}

main();
```

### Step 6: Run It!

```bash
npx tsx index.ts
```

---

## 💡 KenKai's Key Insights

### 1. **Multiple Modes Beat One-Size-Fits-All**
Instead of one generic prompt, create specialized modes:
- General for everyday use
- Coder for development
- Spark for brainstorming
- Research for deep analysis

### 2. **Subagents Are Power Multipliers**
Don't do everything yourself - delegate:
- Architect designs
- Coder implements
- Reviewer checks quality
- Tester validates

### 3. **Context is King**
Inject runtime information:
- Current date/time
- User's name
- Working directory
- Available tools
- Provider-specific features

### 4. **Concise > Verbose**
```
❌ "When you are writing code, you should make sure to follow best practices..."
✅ "CODE FIRST. Explain after (if asked)."
```

### 5. **Workflow Over Description**
Don't just describe what the agent does - tell it HOW:
```
Workflow:
1. Do this
2. Then this
3. Finally this
```

### 6. **Tool-Specific Guidance**
Tell agents which tools to use:
```
✅ "Use mcp__web-search-prime__search for web searches"
❌ "Search the web for information"
```

---

## 📊 The Complete Flow

```
User Message
    ↓
Mode Selection (general/coder/spark/research)
    ↓
System Prompt Builder
    ↓
    ├─ Mode-specific personality
    ├─ Current date/time
    ├─ Working directory
    ├─ Provider-specific tools
    ├─ Available subagents
    └─ User name (if set)
    ↓
Claude Agent SDK
    ↓
    ├─ Main agent (with system prompt)
    ├─ 29 specialized subagents
    ├─ Built-in tools (bash, read, write, grep, glob)
    └─ MCP servers (GitHub search, web search)
    ↓
Response to User
```

---

## 🎓 What You Need to Learn

### Essential Skills:
1. **TypeScript/JavaScript** - For building the backend
2. **Prompt Engineering** - For crafting effective system prompts
3. **Claude Agent SDK** - For agent orchestration
4. **React** (Optional) - For building UI like Agent Girl

### Learning Path:
```
Week 1: Master the Basics
├── Install Claude Agent SDK
├── Create simple agents
├── Understand system prompts
└── Experiment with tools

Week 2: Build Your First Mode System
├── Create 2-3 mode personalities
├── Implement mode switching
├── Add dynamic context
└── Test with real tasks

Week 3: Add Subagents
├── Create 5-10 specialized subagents
├── Define clear workflows
├── Test delegation patterns
└── Build comprehensive test suite

Week 4: Production Polish
├── Add error handling
├── Implement logging
├── Create UI (optional)
└── Deploy and monitor
```

---

## 🔥 Ready-to-Use Templates

### Quick Start: Minimal Agent

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  name: 'MyAgent',
  systemPrompt: `You are MyAgent, a helpful assistant.

  Be conversational and research-oriented. Match the user's tone.`,
  tools: ['bash', 'read', 'write', 'web_search']
});

agent.run('Your task here');
```

### With Modes:

```typescript
const modes = {
  'default': `You are MyAgent. Be helpful and conversational.`,
  'coder': `You are MyAgent in coding mode. CODE FIRST. Explain after.`,
  'research': `You are MyAgent in research mode. Spawn 3+ research agents.`
};

const agent = new Agent({
  systemPrompt: modes['default'],
  tools: ['bash', 'read', 'write', 'web_search']
});
```

### With Subagents:

```typescript
const agents = {
  'researcher': {
    description: 'Research specialist',
    prompt: 'You research and gather information thoroughly.'
  },
  'coder': {
    description: 'Coding specialist',
    prompt: 'You write clean, tested code.'
  }
};

const agent = new Agent({
  systemPrompt: 'You are the orchestrator. Delegate to specialists.',
  agents: agents,
  tools: ['bash', 'read', 'write']
});
```

---

## 🎁 The Secret Sauce

KenKai's approach boils down to:

1. **Personality-driven prompts** - Different modes for different contexts
2. **Workflow-oriented subagents** - Clear steps, not just descriptions
3. **Dynamic context injection** - Runtime info in prompts
4. **Concise, imperative instructions** - "Do X" not "You should X"
5. **Tool-specific guidance** - Tell agents which tools to use
6. **User personalization** - Inject user's name when available

---

## 🚀 Start Building Now!

You have everything you need:
- ✅ The actual system prompts
- ✅ The code structure
- ✅ The patterns and principles
- ✅ Ready-to-use templates
- ✅ Complete agent registry

**Next Steps:**
1. Copy the minimal agent template
2. Run it with your API key
3. Add your first custom mode
4. Create 2-3 subagents
5. Build something awesome!

---

*Built with 🤖 by KenKai*
*Documented by Agent Girl (that's me!)*
