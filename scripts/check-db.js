import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// Load .env
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const firstEq = trimmed.indexOf('=');
      if (firstEq > -1) {
        process.env[trimmed.substring(0, firstEq).trim()] = trimmed.substring(firstEq + 1).trim();
      }
    }
  });
}

async function main() {
  const sql = neon(process.env.DATABASE_URL);
  try {
    const countResult = await sql`SELECT COUNT(*)::int as count FROM fault_readings;`;
    console.log("Total rows in fault_readings:", countResult[0].count);

    if (countResult[0].count > 0) {
      const sample = await sql`SELECT * FROM fault_readings LIMIT 5;`;
      console.log("Sample records:", sample);
    }
  } catch (err) {
    console.error("Database query error:", err);
  }
}

main();
