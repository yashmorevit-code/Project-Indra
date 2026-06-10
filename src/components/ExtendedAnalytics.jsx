import { useMemo } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid, Legend } from 'recharts';

const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f43f5e', '#f59e0b'];

export default function ExtendedAnalytics({ poles, isDarkMode }) {
  const chartData = useMemo(() => {
    if (!poles.length) return { line: [], pie: [], bar: [] };
    
    // 1. Line Chart Data (Faults per Zone)
    const zones = {};
    poles.forEach(p => {
      zones[p.area] = (zones[p.area] || 0) + (p.status === "Faulty" ? 1 : 0);
    });
    const line = Object.keys(zones).map(key => ({ zone: key, Faults: zones[key] }));

    // 2. Pie Chart Data (Fault Type Breakdown)
    const faults = {};
    poles.filter(p => p.status === "Faulty").forEach(p => {
      faults[p.faultType] = (faults[p.faultType] || 0) + 1;
    });
    const pie = Object.keys(faults).map(key => ({ name: key, value: faults[key] }));

    // 3. Bar Chart Data (Average Uptime per Zone)
    const uptimeZones = {};
    poles.forEach(p => {
      if (!uptimeZones[p.area]) uptimeZones[p.area] = { sum: 0, count: 0 };
      uptimeZones[p.area].sum += p.uptime || 100;
      uptimeZones[p.area].count += 1;
    });
    const bar = Object.keys(uptimeZones).map(key => ({
      zone: key, 
      Uptime: parseFloat((uptimeZones[key].sum / uptimeZones[key].count).toFixed(1))
    }));

    return { line, pie, bar };
  }, [poles]);

  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Chart 1: Fault Type Breakdown (Pie) */}
      <div className={`p-5 rounded-xl border h-[300px] flex flex-col transition-colors ${cardBg}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Fault Type Distribution</h3>
        <div className="flex-1 w-full">
          {chartData.pie.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.pie} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {chartData.pie.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', color: textColor }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-emerald-500 font-medium text-sm">No Faults Detected! 🎉</div>
          )}
        </div>
      </div>

      {/* Chart 2: Average Uptime (Bar) */}
      <div className={`p-5 rounded-xl border h-[300px] flex flex-col transition-colors ${cardBg}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Average Uptime by Zone</h3>
        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.bar} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="zone" stroke={textColor} tickLine={false} axisLine={false} />
              <YAxis stroke={textColor} tickLine={false} axisLine={false} domain={} />
              <Tooltip cursor={{ fill: isDarkMode ? '#1e293b' : '#f1f5f9' }} contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
              <Bar dataKey="Uptime" fill="#3b82f6" radius={} barSize={30} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 3: Zonal Disruption Trend (Line) - Spans both columns */}
      <div className={`lg:col-span-2 p-5 rounded-xl border h-[300px] flex flex-col transition-colors ${cardBg}`}>
        <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Zonal Disruption Analytics</h3>
        <div className="flex-1 w-full text-xs">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData.line} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
              <XAxis dataKey="zone" stroke={textColor} tickLine={false} axisLine={false} />
              <YAxis stroke={textColor} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
              <Line type="monotone" dataKey="Faults" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: isDarkMode ? '#0f172a' : '#fff' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}