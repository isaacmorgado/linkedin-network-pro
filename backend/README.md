# Uproot Backend API

Backend API for the Uproot LinkedIn Extension, providing pathfinding algorithms, message generation, and semantic search capabilities.

## Technology Stack

- **Runtime:** Node.js v20+
- **Framework:** Express.js 5.x
- **Language:** TypeScript 5.9+
- **Database:** PostgreSQL (Vercel Postgres)
- **AI:** OpenAI GPT-4 & Embeddings
- **Deployment:** Vercel Serverless Functions

## Project Structure

```
backend/
├── src/
│   ├── routes/          # API route handlers
│   ├── services/        # Business logic
│   ├── db/              # Database connection & migrations
│   ├── middleware/      # Auth, validation, rate limiting
│   └── types/           # TypeScript type definitions
├── api/                 # Vercel serverless functions
├── package.json
├── tsconfig.json
└── vercel.json          # Vercel deployment config
```

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from template:
```bash
cp .env.example .env
```

3. Update `.env` with your credentials:
   - `DATABASE_URL`: PostgreSQL connection string
   - `JWT_SECRET`: Secret key for JWT tokens
   - `OPENAI_API_KEY`: Your OpenAI API key

4. Run database migrations:
```bash
npm run migrate
```

5. Start development server:
```bash
npm run dev
```

## API Endpoints

- `POST /api/search` - Semantic search for profiles
- `POST /api/find-path` - Find connection paths
- `POST /api/generate-message` - Generate personalized messages
- `POST /api/chat` - Conversational interface
- `POST /api/embeddings` - Generate/retrieve embeddings

## Deployment

Deploy to Vercel:
```bash
vercel deploy
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`

## Development

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run type-check` - Check TypeScript types
- `npm test` - Run tests
