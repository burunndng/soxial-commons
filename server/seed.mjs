import mysql from "mysql2/promise";
import * as dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL not set");
}

async function seed() {
  const connection = await mysql.createConnection(DATABASE_URL);

  try {
    console.log("Seeding database...");

    // Insert communities
    await connection.execute(`
      INSERT IGNORE INTO communities (name, displayName, description) VALUES
      ('technology', 'Technology', 'Programming, software, hardware, and the future of tech'),
      ('design', 'Design', 'UI/UX, graphic design, architecture, and visual thinking'),
      ('science', 'Science', 'Research, discoveries, and evidence-based discussion'),
      ('books', 'Books', 'Reading recommendations and literary discussion'),
      ('general', 'General', 'Everything else — open discussion')
    `);

    console.log("✓ Communities seeded");
    console.log("✓ Database ready");
  } catch (error) {
    console.error("Seeding error:", error);
    throw error;
  } finally {
    await connection.end();
  }
}

seed().catch(console.error);
