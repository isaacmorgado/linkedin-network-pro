# Example CLAUDE.md - Your Agent's Memory

This file gives your agent context about the project. Place it in your project root.

## Project Overview

This is a [web app / CLI tool / API / etc.] that [does what].

Built with: [TypeScript, React, Node.js, etc.]

## Architecture

```
src/
├── agents/       # Custom agent definitions
├── tools/        # Custom tools
├── config/       # Configuration
└── main.ts       # Entry point
```

## Development Workflow

### Getting Started
```bash
npm install
npm run dev
```

### Common Tasks
```bash
npm test              # Run tests
npm run build         # Build for production
npm run agent         # Launch agent interactively
```

## Agent Guidelines

### When Coding
- Always write TypeScript with strict types
- Include tests for new features
- Run `npm test` before committing
- Follow existing code style

### When Debugging
1. Check the logs in `logs/`
2. Review recent changes with `git log`
3. Run tests to isolate the issue
4. Fix and verify

### File Structure Rules
- Components in `src/components/`
- Utils in `src/utils/`
- Types in `src/types/`
- Tests alongside source files as `*.test.ts`

## Important Context

### API Keys
- ANTHROPIC_API_KEY - Required for Claude
- GITHUB_TOKEN - Required for GitHub MCP
- DATABASE_URL - PostgreSQL connection

### Configuration Files
- `.env` - Environment variables (DO NOT COMMIT)
- `tsconfig.json` - TypeScript config
- `vite.config.ts` - Build config

### Known Issues
1. **Database connection pooling** - Sometimes needs restart
   - Fix: `docker-compose restart postgres`

2. **Hot reload not working** - Clear the cache
   - Fix: `rm -rf .vite && npm run dev`

## Project-Specific Instructions

### For This Project
- Always validate user input
- Log all agent actions to `logs/agent.log`
- Use the `logger` utility, not `console.log`
- Follow the error handling pattern in `src/utils/errors.ts`

### Testing Strategy
- Unit tests for utilities
- Integration tests for agents
- E2E tests for critical workflows

### Deployment
```bash
npm run build
npm run deploy:staging    # Deploy to staging
npm run deploy:production # Deploy to production (requires approval)
```

## Best Practices for This Codebase

1. **Type Safety First** - No `any` types allowed
2. **Error Handling** - Always use try/catch with proper logging
3. **Documentation** - Document complex functions with JSDoc
4. **Testing** - Minimum 80% code coverage
5. **Git** - Meaningful commit messages following Conventional Commits

## Resources

- [Project Documentation](./docs/)
- [API Documentation](./docs/api.md)
- [Architecture Decision Records](./docs/adr/)

---

**IMPORTANT**: Before making changes:
1. Read the relevant documentation
2. Check for existing tests
3. Follow the established patterns
4. Run tests before committing

**YOU MUST**: Always verify your changes work before marking a task complete!
