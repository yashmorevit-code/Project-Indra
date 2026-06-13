import { Lightbulb, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

export default function StatsOverview({ poles, isDarkMode, isTsOffline }) {
  const total = poles.length;
  const working = poles.filter(p => p.status === "Up").length;
  const faulty = poles.filter(p => p.status === "Down").length;
  
  // Compute dynamic operational percentage
  const networkHealth = total > 0 ? ((working / total) * 100).toFixed(1) : 100;
  
  // Compute dynamic average uptime across monitored poles
  const avgUptimeVal = total > 0 
    ? (poles.reduce((acc, p) => acc + (p.uptime || 100), 0) / total).toFixed(1)
    : 100;

  const metrics = [
    { title: "TOTAL STREETLIGHTS", value: total, sub: "All Monitored Poles", icon: <Lightbulb size={24} className="text-purple-500" />, iconBg: "bg-purple-500/10" },
    { title: "WORKING LIGHTS", value: working, sub: isTsOffline ? "⚠️ Telemetry Stale" : `${networkHealth}% Operational`, icon: <CheckCircle2 size={24} className="text-emerald-500" />, iconBg: "bg-emerald-500/10", textCol: isTsOffline ? "text-amber-500" : "text-emerald-500" },
    { title: "OFFLINE LIGHTS", value: faulty, sub: isTsOffline ? "⚠️ Telemetry Stale" : "Needs Attention", icon: <AlertTriangle size={24} className="text-rose-500" />, iconBg: "bg-rose-500/10", textCol: isTsOffline ? "text-amber-500" : "text-rose-500" },
    { title: "AVERAGE UPTIME", value: `${avgUptimeVal}%`, sub: "This Month", icon: <Activity size={24} className="text-blue-500" />, iconBg: "bg-blue-500/10", textCol: "text-blue-500" },
  ];

  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-400";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {metrics.map((card, idx) => (
        <div 
          key={idx} 
          className={`p-4 rounded-xl border flex items-center justify-between transition-all duration-300 ${cardBg}`}
        >
          <div>
            <p className={`text-[9px] font-bold tracking-widest uppercase mb-1 ${card.textCol || textSecondary}`}>{card.title}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h3 className={`text-3xl sm:text-4xl font-extrabold tracking-tight ${textPrimary}`}>{card.value}</h3>
            </div>
            <p className={`text-[11px] font-semibold mt-1 ${isTsOffline && (card.title === "WORKING LIGHTS" || card.title === "OFFLINE LIGHTS") ? 'text-amber-500 animate-pulse' : textSecondary}`}>{card.sub}</p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}