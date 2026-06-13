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

const sql = neon(process.env.DATABASE_URL);

async function main() {
  console.log("Seeding 30 days of historical telemetry data...");
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS fault_readings (
        entry_id INT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        pole_id VARCHAR(50) NOT NULL,
        status INT NOT NULL,
        node_uptime INT,
        zone VARCHAR(50)
      );
    `;

    await sql`
      ALTER TABLE fault_readings ADD COLUMN IF NOT EXISTS zone VARCHAR(50);
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS traffic_readings (
        entry_id INT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        vehicle_count INT NOT NULL,
        traffic_density INT NOT NULL
      );
    `;

    const now = new Date();
    let faultEntryId = 1000;
    let trafficEntryId = 1000;

    // Seed 30 days
    for (let day = 30; day >= 0; day--) {
      const date = new Date(now.getTime() - day * 24 * 60 * 60 * 1000);
      const isoString = date.toISOString();

      // Seed 9 poles
      for (let pNum = 1; pNum <= 9; pNum++) {
        const poleId = `P-${pNum}`;
        let zone = 'Zone 1';
        if (pNum >= 4 && pNum <= 6) zone = 'Zone 2';
        else if (pNum >= 7 && pNum <= 9) zone = 'Zone 3';

        // 95% chance Up, 5% chance Down
        const status = Math.random() > 0.95 ? 1 : 0;
        const uptime = status === 0 ? Math.floor(Math.random() * 5) + 95 : 0;

        await sql`
          INSERT INTO fault_readings (entry_id, created_at, pole_id, status, node_uptime, zone)
          VALUES (${faultEntryId++}, ${isoString}, ${poleId}, ${status}, ${uptime}, ${zone})
          ON CONFLICT (entry_id) DO NOTHING;
        `;
      }

      // Seed traffic log for the day
      const vehicleCount = Math.floor(Math.random() * 500) + 100;
      const trafficDensity = Math.floor(Math.random() * 8) + 1; // 1 to 8

      await sql`
        INSERT INTO traffic_readings (entry_id, created_at, vehicle_count, traffic_density)
        VALUES (${trafficEntryId++}, ${isoString}, ${vehicleCount}, ${trafficDensity})
        ON CONFLICT (entry_id) DO NOTHING;
      `;
    }

    console.log("Database seeded successfully!");
  } catch (err) {
    console.error("Seeding error:", err);
  }
}

main();
