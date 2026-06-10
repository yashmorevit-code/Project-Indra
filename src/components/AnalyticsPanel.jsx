import { useMemo } from 'react'; // <--- THIS WAS MISSING!
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

export default function AnalyticsPanel({ isDarkMode, poles = [] }) {
  // Aggregate data from your database array dynamically
  const chartData = useMemo(() => {
    if (!poles.length) return [{ zone: 'Empty', Faults: 0 }];
    
    // Group active poles by zone profiles for diagnostic tracking
    const zones = {};
    poles.forEach(p => {
      zones[p.area] = (zones[p.area] || 0) + (p.status === "Faulty" ? 1 : 0);
    });

    return Object.keys(zones).map(key => ({
      zone: key,
      Faults: zones[key]
    }));
  }, [poles]);

  const containerBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";

  return (
    <div className={`p-5 rounded-xl border h-[280px] flex flex-col transition-colors duration-300 ${containerBg}`}>
      <div className="mb-4">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
          Zonal Distruption Analytics
        </h3>
      </div>
      <div className="flex-1 w-full text-xs">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="zone" stroke={textColor} fontSize={9} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} fontSize={10} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip 
              contentStyle={{ background: isDarkMode ? '#1e293b' : '#fff', border: `1px solid ${gridColor}`, borderRadius: '6px', color: isDarkMode ? '#fff' : '#000' }}
              itemStyle={{ color: '#8b5cf6' }}
            />
            <Line type="monotone" dataKey="Faults" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: isDarkMode ? '#0f172a' : '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}