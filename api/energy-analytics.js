import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return res.status(500).json({ error: 'Database URL not configured' });
  }

  try {
    const sql = neon(databaseUrl);

    // 1. Fetch historical fault readings for the last 30 days
    const faultReadings = await sql`
      SELECT pole_id, status, node_uptime, zone, created_at
      FROM fault_readings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    // 2. Fetch traffic readings for the last 30 days
    const trafficReadings = await sql`
      SELECT traffic_density
      FROM traffic_readings
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `;

    // Calculate average traffic density across last 30 days
    let avgTrafficDensity = 5.0;
    if (trafficReadings.length > 0) {
      const sum = trafficReadings.reduce((acc, curr) => acc + curr.traffic_density, 0);
      avgTrafficDensity = sum / trafficReadings.length;
    }

    // IoT Dimming factor: more traffic = brighter, less traffic = dimmed (saves more energy)
    // Scale: min dimming = 30% power (0.3), max dimming = 100% power (1.0)
    // Scale range = 0.7 * (avgTrafficDensity / 8.0) + 0.3
    const dimmingFactor = Math.min(1.0, Math.max(0.3, 0.7 * (avgTrafficDensity / 8.0) + 0.3));

    // Energy constants
    const WATTAGE_PER_POLE_KW = 0.15; // 150 Watts per pole
    const COST_PER_KWH = 7.5; // ₹7.5 per kWh
    const ASSUMED_MONTHLY_HOURS = 12 * 30; // 12 hours straight at night * 30 days = 360 hours

    // Group readings by pole to find average uptime
    const poleData = {};

    faultReadings.forEach(reading => {
      const { pole_id, node_uptime, zone } = reading;
      const parsedZone = zone || 'Zone 1';
      if (!poleData[pole_id]) {
        poleData[pole_id] = { uptimeSum: 0, count: 0, zone: parsedZone };
      }
      // Clamp uptime to 0-100% to handle legacy non-percentage counters gracefully
      const clampedUptime = Math.min(100, Math.max(0, node_uptime || 0));
      poleData[pole_id].uptimeSum += clampedUptime;
      poleData[pole_id].count += 1;
    });

    // Default list of 9 poles to ensure all are represented
    const defaultPoles = [
      { id: 'P-1', zone: 'Zone 1' },
      { id: 'P-2', zone: 'Zone 1' },
      { id: 'P-3', zone: 'Zone 1' },
      { id: 'P-4', zone: 'Zone 2' },
      { id: 'P-5', zone: 'Zone 2' },
      { id: 'P-6', zone: 'Zone 2' },
      { id: 'P-7', zone: 'Zone 3' },
      { id: 'P-8', zone: 'Zone 3' },
      { id: 'P-9', zone: 'Zone 3' }
    ];

    const zoneMetrics = {
      'Zone 1': { consumedKwh: 0, baselineKwh: 0, savedKwh: 0, cost: 0, savedCost: 0, poleCount: 0 },
      'Zone 2': { consumedKwh: 0, baselineKwh: 0, savedKwh: 0, cost: 0, savedCost: 0, poleCount: 0 },
      'Zone 3': { consumedKwh: 0, baselineKwh: 0, savedKwh: 0, cost: 0, savedCost: 0, poleCount: 0 }
    };

    defaultPoles.forEach(p => {
      const record = poleData[p.id];
      const avgUptime = record && record.count > 0 ? (record.uptimeSum / record.count) : 98.0; // default to 98% uptime if no logs
      const zone = p.zone;

      // 1. Without IoT: light is turned on 12 hours straight at night (360 hours a month)
      const baselineKwh = ASSUMED_MONTHLY_HOURS * WATTAGE_PER_POLE_KW;

      // 2. With IoT: Dynamic power usage based on active uptime & traffic dimming
      const activeHours = ASSUMED_MONTHLY_HOURS * (avgUptime / 100);
      const consumedKwh = activeHours * WATTAGE_PER_POLE_KW * dimmingFactor;

      // 3. Savings: baseline - consumed
      const savedKwh = baselineKwh - consumedKwh;

      const cost = consumedKwh * COST_PER_KWH;
      const savedCost = savedKwh * COST_PER_KWH;

      zoneMetrics[zone].consumedKwh += consumedKwh;
      zoneMetrics[zone].baselineKwh += baselineKwh;
      zoneMetrics[zone].savedKwh += savedKwh;
      zoneMetrics[zone].cost += cost;
      zoneMetrics[zone].savedCost += savedCost;
      zoneMetrics[zone].poleCount += 1;
    });

    const responseData = Object.keys(zoneMetrics).map(zoneName => ({
      zone: zoneName,
      poleCount: zoneMetrics[zoneName].poleCount,
      baselineKwh: parseFloat(zoneMetrics[zoneName].baselineKwh.toFixed(2)),
      consumedKwh: parseFloat(zoneMetrics[zoneName].consumedKwh.toFixed(2)),
      savedKwh: parseFloat(zoneMetrics[zoneName].savedKwh.toFixed(2)),
      cost: parseFloat(zoneMetrics[zoneName].cost.toFixed(2)),
      savedCost: parseFloat(zoneMetrics[zoneName].savedCost.toFixed(2)),
      savedPercentage: parseFloat(((zoneMetrics[zoneName].savedKwh / zoneMetrics[zoneName].baselineKwh) * 100).toFixed(1))
    }));

    return res.status(200).json({
      success: true,
      avgTrafficDensity: parseFloat(avgTrafficDensity.toFixed(2)),
      dimmingFactor: parseFloat(dimmingFactor.toFixed(2)),
      data: responseData
    });

  } catch (error) {
    console.error('Error fetching energy analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch energy analytics', details: error.message });
  }
}
