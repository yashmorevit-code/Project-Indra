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
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set in environment");
    process.exit(1);
  }

  console.log("Connecting to database...");
  const sql = neon(databaseUrl);

  try {
    // 1. Re-create tables if they don't exist
    console.log("Setting up schemas...");
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
      CREATE TABLE IF NOT EXISTS traffic_readings (
        entry_id INT PRIMARY KEY,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL,
        vehicle_count INT NOT NULL,
        traffic_density INT NOT NULL,
        zone VARCHAR(50)
      );
    `;

    // 2. Clear existing entries to prevent primary key conflicts and ensure clean mock trends
    console.log("Clearing existing records...");
    await sql`TRUNCATE TABLE fault_readings CASCADE;`;
    await sql`TRUNCATE TABLE traffic_readings CASCADE;`;

    const now = new Date();

    // 3. Seed Traffic Readings (30 days of hourly data)
    console.log("Generating traffic readings data...");
    const trafficQueries = [];
    const totalHours = 30 * 24;
    let entryId = 10000;

    for (let i = totalHours; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 60 * 60 * 1000);
      const hour = date.getHours();

      // Create diurnal traffic density cycle: morning/evening rush hours, midnight lows
      let baseDensityZone1 = 4;
      if (hour >= 8 && hour <= 10) baseDensityZone1 = 8;
      else if (hour >= 17 && hour <= 20) baseDensityZone1 = 9;
      else if (hour >= 23 || hour < 5) baseDensityZone1 = 2;

      // Add variation per zone
      const densityZ1 = Math.min(10, Math.max(1, Math.round(baseDensityZone1 + (Math.random() - 0.5) * 2)));
      const countZ1 = Math.round(densityZ1 * 12 + Math.random() * 8);

      const densityZ2 = Math.min(10, Math.max(1, Math.round((baseDensityZone1 * 0.85) + (Math.random() - 0.5) * 2)));
      const countZ2 = Math.round(densityZ2 * 10 + Math.random() * 6);

      const densityZ3 = Math.min(10, Math.max(1, Math.round((baseDensityZone1 * 0.7) + (Math.random() - 0.5) * 3)));
      const countZ3 = Math.round(densityZ3 * 8 + Math.random() * 5);

      trafficQueries.push(sql`
        INSERT INTO traffic_readings (entry_id, created_at, vehicle_count, traffic_density, zone)
        VALUES (${entryId++}, ${date.toISOString()}, ${countZ1}, ${densityZ1}, 'Zone 1')
      `);

      trafficQueries.push(sql`
        INSERT INTO traffic_readings (entry_id, created_at, vehicle_count, traffic_density, zone)
        VALUES (${entryId++}, ${date.toISOString()}, ${countZ2}, ${densityZ2}, 'Zone 2')
      `);

      trafficQueries.push(sql`
        INSERT INTO traffic_readings (entry_id, created_at, vehicle_count, traffic_density, zone)
        VALUES (${entryId++}, ${date.toISOString()}, ${countZ3}, ${densityZ3}, 'Zone 3')
      `);
    }

    console.log(`Executing ${trafficQueries.length} traffic inserts in parallel chunks...`);
    const CHUNK_SIZE = 150;
    for (let i = 0; i < trafficQueries.length; i += CHUNK_SIZE) {
      const chunk = trafficQueries.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk);
    }

    // 4. Seed Fault Readings (30 days, recorded every 6 hours per pole to generate realistic uptime percentages)
    console.log("Generating fault readings data...");
    const faultQueries = [];
    const polesList = [
      { id: 'P-1', zone: 'Zone 1', baseUptime: 99.2 },
      { id: 'P-2', zone: 'Zone 1', baseUptime: 98.5 },
      { id: 'P-3', zone: 'Zone 1', baseUptime: 97.8 },
      { id: 'P-4', zone: 'Zone 2', baseUptime: 94.0 },
      { id: 'P-5', zone: 'Zone 2', baseUptime: 89.2 },
      { id: 'P-6', zone: 'Zone 2', baseUptime: 95.5 },
      { id: 'P-7', zone: 'Zone 3', baseUptime: 91.0 },
      { id: 'P-8', zone: 'Zone 3', baseUptime: 92.4 },
      { id: 'P-9', zone: 'Zone 3', baseUptime: 85.0 }
    ];

    let faultEntryId = 50000;
    const intervalsCount = 30 * 4; // 4 records per day (every 6 hours)

    for (let i = intervalsCount; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 6 * 60 * 60 * 1000);

      for (const p of polesList) {
        const isOnline = Math.random() * 100 <= p.baseUptime;
        const status = isOnline ? 0 : 1;
        const nodeUptime = isOnline 
          ? Math.round(p.baseUptime + (Math.random() - 0.5) * 2) 
          : Math.round(p.baseUptime - 15 - Math.random() * 10);

        const clampedUptime = Math.min(100, Math.max(0, nodeUptime));

        faultQueries.push(sql`
          INSERT INTO fault_readings (entry_id, created_at, pole_id, status, node_uptime, zone)
          VALUES (${faultEntryId++}, ${date.toISOString()}, ${p.id}, ${status}, ${clampedUptime}, ${p.zone})
        `);
      }
    }

    console.log(`Executing ${faultQueries.length} fault inserts in parallel chunks...`);
    for (let i = 0; i < faultQueries.length; i += CHUNK_SIZE) {
      const chunk = faultQueries.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk);
    }

    console.log(`Success! Seeding complete.`);
    console.log(`- Inserted ${trafficQueries.length} traffic readings.`);
    console.log(`- Inserted ${faultQueries.length} fault readings.`);

  } catch (err) {
    console.error("Error seeding database:", err);
  }
}

main();
