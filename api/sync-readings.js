import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { channelId, apiKey, type, results = 50 } = req.body;

  if (!channelId || !apiKey || !type) {
    return res.status(400).json({ error: 'Missing channelId, apiKey, or type' });
  }

  if (type !== 'fault' && type !== 'traffic') {
    return res.status(400).json({ error: 'Invalid type. Must be "fault" or "traffic"' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database URL not configured' });
  }

  try {
    // 1. Fetch latest feeds from ThingSpeak
    const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${apiKey}&results=${results}`;
    const tsRes = await fetch(url);
    if (!tsRes.ok) {
      throw new Error(`ThingSpeak API returned status ${tsRes.status}`);
    }
    const tsData = await tsRes.json();

    if (!tsData.feeds || tsData.feeds.length === 0) {
      return res.status(200).json({ success: true, message: 'No feeds to sync' });
    }

    // Initialize Neon client
    const sql = neon(databaseUrl);

    let insertedCount = 0;

    if (type === 'fault') {
      // Create fault_readings table
      await sql`
        CREATE TABLE IF NOT EXISTS fault_readings (
          entry_id INT PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          pole_id VARCHAR(50) NOT NULL,
          status INT NOT NULL
        );
      `;

      // Safely run migrations to add new columns if table already exists
      await sql`
        ALTER TABLE fault_readings ADD COLUMN IF NOT EXISTS node_uptime INT;
      `;
      await sql`
        ALTER TABLE fault_readings ADD COLUMN IF NOT EXISTS zone VARCHAR(50);
      `;

      // Insert fault feeds
      for (const feed of tsData.feeds) {
        if (!feed.field1 || !feed.field2) continue; // Skip incomplete feeds

        const createdAt = new Date(feed.created_at).toISOString();
        const poleId = feed.field1.toString().startsWith('P-') ? feed.field1 : `P-${feed.field1}`;
        const statusVal = parseInt(feed.field2);

        const poleNum = parseInt(poleId.replace('P-', ''));
        let zoneVal = 'Zone 1';
        if (poleNum >= 4 && poleNum <= 6) {
          zoneVal = 'Zone 2';
        } else if (poleNum >= 7 && poleNum <= 9) {
          zoneVal = 'Zone 3';
        }

        const result = await sql`
          INSERT INTO fault_readings (entry_id, created_at, pole_id, status, node_uptime, zone)
          VALUES (
            ${parseInt(feed.entry_id)},
            ${createdAt},
            ${poleId},
            ${statusVal},
            ${feed.field3 ? parseInt(feed.field3) : null},
            ${zoneVal}
          )
          ON CONFLICT (entry_id) DO NOTHING
          RETURNING entry_id;
        `;

        if (result.length > 0) {
          insertedCount++;
        }
      }
    } else if (type === 'traffic') {
      // Create traffic_readings table
      await sql`
        CREATE TABLE IF NOT EXISTS traffic_readings (
          entry_id INT PRIMARY KEY,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL,
          vehicle_count INT NOT NULL,
          traffic_density INT NOT NULL
        );
      `;

      // Insert traffic feeds
      for (const feed of tsData.feeds) {
        if (!feed.field1 || !feed.field2) continue; // Skip incomplete feeds

        const createdAt = new Date(feed.created_at).toISOString();
        const vehicleCount = parseInt(feed.field1) || 0;
        const trafficDensity = parseInt(feed.field2) || 0;

        const result = await sql`
          INSERT INTO traffic_readings (entry_id, created_at, vehicle_count, traffic_density)
          VALUES (
            ${parseInt(feed.entry_id)},
            ${createdAt},
            ${vehicleCount},
            ${trafficDensity}
          )
          ON CONFLICT (entry_id) DO NOTHING
          RETURNING entry_id;
        `;

        if (result.length > 0) {
          insertedCount++;
        }
      }
    }

    return res.status(200).json({
      success: true,
      totalFeeds: tsData.feeds.length,
      insertedCount,
      message: `Successfully synced ${insertedCount} new ${type} readings`
    });

  } catch (error) {
    console.error('Error syncing readings:', error);
    return res.status(500).json({ error: 'Failed to sync readings', details: error.message });
  }
}
