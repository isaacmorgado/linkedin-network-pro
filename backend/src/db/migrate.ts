import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { pool, query } from './client.js';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// Simple Migration Runner
// ============================================================================

interface Migration {
  file: string;
  sql: string;
}

// List of migrations in order
const migrations: Migration[] = [
  {
    file: '001_initial_schema.sql',
    sql: readFileSync(join(__dirname, 'migrations', '001_initial_schema.sql'), 'utf-8'),
  },
  // Add more migrations here as needed
];

/**
 * Create migrations tracking table if it doesn't exist
 */
async function createMigrationsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMP DEFAULT NOW()
    )
  `);
  console.log('✅ Migrations table ready');
}

/**
 * Check if a migration has been executed
 */
async function isMigrationExecuted(filename: string): Promise<boolean> {
  const result = await query(
    'SELECT * FROM migrations WHERE filename = $1',
    [filename]
  );
  return result.rows.length > 0;
}

/**
 * Mark a migration as executed
 */
async function markMigrationExecuted(filename: string): Promise<void> {
  await query(
    'INSERT INTO migrations (filename) VALUES ($1)',
    [filename]
  );
}

/**
 * Run all pending migrations
 */
async function runMigrations(): Promise<void> {
  console.log('🚀 Starting database migrations...\n');

  try {
    // Create migrations table
    await createMigrationsTable();

    // Run each migration
    for (const migration of migrations) {
      const executed = await isMigrationExecuted(migration.file);

      if (executed) {
        console.log(`⏭️  Skipping ${migration.file} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${migration.file}...`);

      try {
        // Execute migration SQL
        await query(migration.sql);

        // Mark as executed
        await markMigrationExecuted(migration.file);

        console.log(`✅ Successfully executed ${migration.file}\n`);
      } catch (error) {
        console.error(`❌ Failed to execute ${migration.file}:`, error);
        throw error;
      }
    }

    console.log('🎉 All migrations completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };
