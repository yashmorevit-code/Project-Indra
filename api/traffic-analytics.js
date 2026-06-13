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

    // 1. Fetch overall stats per zone
    const zoneStats = await sql`
      SELECT 
        zone,
        AVG(traffic_density)::float as avg_density,
        SUM(vehicle_count)::int as total_vehicles,
        COUNT(*)::int as readings_count
      FROM traffic_readings
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY zone
    `;

    // 2. Fetch hourly trend data for the last 7 days
    const hourlyTrends = await sql`
      SELECT 
        zone,
        DATE_TRUNC('hour', created_at) AS time_bucket,
        AVG(traffic_density)::float AS avg_density,
        SUM(vehicle_count)::int AS total_vehicles
      FROM traffic_readings
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY zone, time_bucket
      ORDER BY time_bucket ASC
    `;

    // 3. Find peak traffic hours per zone
    const peakHours = await sql`
      WITH hourly_averages AS (
        SELECT 
          zone,
          EXTRACT(HOUR FROM created_at) AS hr,
          AVG(traffic_density)::float as avg_d
        FROM traffic_readings
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY zone, hr
      ),
      ranked_hours AS (
        SELECT 
          zone,
          hr,
          avg_d,
          ROW_NUMBER() OVER(PARTITION BY zone ORDER BY avg_d DESC) as rnk
        FROM hourly_averages
      )
      SELECT zone, hr, avg_d
      FROM ranked_hours
      WHERE rnk = 1
    `;

    // Package metrics per zone
    const zonesList = ['Zone 1', 'Zone 2', 'Zone 3'];
    const summary = zonesList.map(z => {
      const stats = zoneStats.find(s => s.zone === z) || { avg_density: 0, total_vehicles: 0, readings_count: 0 };
      const peak = peakHours.find(p => p.zone === z) || { hr: 0, avg_d: 0 };

      // Format peak hour nicely (e.g. 18:00 or 6 PM)
      const hourNum = parseInt(peak.hr);
      const ampm = hourNum >= 12 ? 'PM' : 'AM';
      const formattedHour = `${hourNum % 12 || 12} ${ampm}`;

      return {
        zone: z,
        avgDensity: parseFloat(parseFloat(stats.avg_density || 0).toFixed(1)),
        totalVehicles: stats.total_vehicles || 0,
        peakHour: formattedHour,
        peakDensity: parseFloat(parseFloat(peak.avg_d || 0).toFixed(1))
      };
    });

    // Format the line chart data:
    // Recharts expects objects like: { time: '09:00', 'Zone 1': 4.5, 'Zone 2': 3.2, 'Zone 3': 2.1 }
    // We group the hourlyTrends by time_bucket
    const trendsMap = {};
    hourlyTrends.forEach(t => {
      const timeStr = new Date(t.time_bucket).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
      if (!trendsMap[timeStr]) {
        trendsMap[timeStr] = { time: timeStr };
      }
      trendsMap[timeStr][t.zone] = parseFloat((t.avg_density || 0).toFixed(1));
    });

    const chartData = Object.values(trendsMap);

    return res.status(200).json({
      success: true,
      summary,
      chartData
    });

  } catch (error) {
    console.error('Error fetching traffic analytics:', error);
    return res.status(500).json({ error: 'Failed to fetch traffic analytics', details: error.message });
  }
}
