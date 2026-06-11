import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const telemetryData = [
  { time: '12 AM', uptime: 99.9, energy: 14.2 },
  { time: '4 AM', uptime: 99.5, energy: 14.0 },
  { time: '8 AM', uptime: 98.2, energy: 2.1 },  
  { time: '12 PM', uptime: 98.1, energy: 0.0 },
  { time: '4 PM', uptime: 97.9, energy: 0.5 },
  { time: '8 PM', uptime: 97.5, energy: 13.8 }, 
  { time: 'Now', uptime: 97.5, energy: 14.5 },
];

export function UptimeChart({ isDarkMode }) {
  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';

  return (
    <div className={`p-4 rounded-xl border w-full h-full transition-colors flex flex-col min-h-0 overflow-hidden ${cardBg}`}>
      <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>System Uptime Trend</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={textColor} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} tickLine={false} axisLine={false} domain={[90, 100]} />
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
            <Line type="monotone" dataKey="uptime" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6', strokeWidth: 1.5, stroke: isDarkMode ? '#0f172a' : '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EnergyChart({ isDarkMode }) {
  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';

  return (
    <div className={`p-4 rounded-xl border w-full h-full transition-colors flex flex-col min-h-0 overflow-hidden ${cardBg}`}>
      <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Energy Consumption (kWh)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={telemetryData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={textColor} tickLine={false} axisLine={false} />
            <YAxis stroke={textColor} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
            <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={{ r: 3, fill: '#10b981', strokeWidth: 1.5, stroke: isDarkMode ? '#0f172a' : '#fff' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}