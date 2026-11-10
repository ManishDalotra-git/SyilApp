require('dotenv').config();
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is missing from .env');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function setupAnnouncementsTables() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id BIGSERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        created_by_email VARCHAR(255) NOT NULL,
        created_by_name VARCHAR(255),
        is_published BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcement_likes (
        id BIGSERIAL PRIMARY KEY,
        announcement_id BIGINT NOT NULL
          REFERENCES announcements(id) ON DELETE CASCADE,
        user_email VARCHAR(255) NOT NULL,
        user_name VARCHAR(255),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (announcement_id, user_email)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS announcement_media (
        id BIGSERIAL PRIMARY KEY,
        announcement_id BIGINT NOT NULL
          REFERENCES announcements(id) ON DELETE CASCADE,
        media_url TEXT NOT NULL,
        media_type VARCHAR(20) NOT NULL
          CHECK (media_type IN ('image', 'video')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_announcements_created_at
      ON announcements (created_at DESC);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_announcement_likes_announcement_id
      ON announcement_likes (announcement_id);
    `);

    await client.query('COMMIT');

    console.log('Announcements tables created successfully.');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Announcements table setup failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

setupAnnouncementsTables().catch(async (error) => {
  console.error('Database setup failed:', error.message);
  await pool.end();
  process.exitCode = 1;
});
