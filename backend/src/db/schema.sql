-- ============================================================================
-- Uproot Backend Database Schema
-- PostgreSQL Schema for LinkedIn Universal Connection Feature
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgvector"; -- For embedding storage (requires pgvector extension)

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  linkedin_id VARCHAR(255),
  subscription_tier VARCHAR(50) DEFAULT 'free',
  subscription_expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- TARGETS TABLE
-- Stores people the user wants to connect with
-- ============================================================================
CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_linkedin_id VARCHAR(255) NOT NULL,
  target_name VARCHAR(255),
  target_headline TEXT,
  status VARCHAR(50) DEFAULT 'researching', -- researching | pending | connected | in_progress
  match_score INTEGER,
  best_path JSONB, -- EnhancedConnectionRoute
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, target_linkedin_id)
);

-- ============================================================================
-- MESSAGES TABLE
-- Stores generated messages and conversation history
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  target_id UUID REFERENCES targets(id) ON DELETE CASCADE,
  message_text TEXT NOT NULL,
  message_type VARCHAR(50), -- intro_request | cold_outreach | follow_up
  tone VARCHAR(50), -- professional | casual | enthusiastic
  personalization_context JSONB,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- EMBEDDINGS CACHE TABLE
-- Caches OpenAI embeddings to reduce API costs
-- ============================================================================
CREATE TABLE IF NOT EXISTS embeddings_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text_hash VARCHAR(64) UNIQUE NOT NULL, -- SHA-256 hash of text
  embedding VECTOR(1536), -- PostgreSQL pgvector extension (1536 dimensions for text-embedding-3-large)
  model VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP DEFAULT (NOW() + INTERVAL '30 days')
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_targets_user_id ON targets(user_id);
CREATE INDEX IF NOT EXISTS idx_targets_status ON targets(status);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_target_id ON messages(target_id);
CREATE INDEX IF NOT EXISTS idx_embeddings_hash ON embeddings_cache(text_hash);
CREATE INDEX IF NOT EXISTS idx_embeddings_expires ON embeddings_cache(expires_at);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp on users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_targets_updated_at BEFORE UPDATE ON targets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
