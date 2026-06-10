import { Lightbulb, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';

export default function StatsOverview({ poles, isDarkMode }) {
  const total = poles.length;
  const working = poles.filter(p => p.status === "Working").length;
  const faulty = poles.filter(p => p.status === "Faulty").length;
  const networkHealth = total > 0 ? ((working / total) * 100).toFixed(1) : 0;

  const metrics = [
    { title: "TOTAL STREETLIGHTS", value: total, sub: "All Streetlights", icon: <Lightbulb size={24} className="text-purple-500" />, iconBg: "bg-purple-500/10" },
    { title: "WORKING LIGHTS", value: working, sub: `${networkHealth}% Operational`, icon: <CheckCircle2 size={24} className="text-emerald-500" />, iconBg: "bg-emerald-500/10", textCol: "text-emerald-500" },
    { title: "FAULTY LIGHTS", value: faulty, sub: "Needs Attention", icon: <AlertTriangle size={24} className="text-rose-500" />, iconBg: "bg-rose-500/10", textCol: "text-rose-500" },
    { title: "AVERAGE UPTIME", value: "97.5%", sub: "This Month", icon: <Activity size={24} className="text-blue-500" />, iconBg: "bg-blue-500/10", textCol: "text-blue-500" },
  ];

  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-400";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
      {metrics.map((card, idx) => (
        <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between transition-colors duration-300 ${cardBg}`}>
          <div>
            <p className={`text-[10px] font-semibold tracking-wider ${card.textCol || textSecondary}`}>{card.title}</p>
            <div className="flex items-baseline gap-2 mt-1">
                <h3 className={`text-3xl font-bold ${textPrimary}`}>{card.value}</h3>
            </div>
            <p className={`text-xs mt-1 ${textSecondary}`}>{card.sub}</p>
          </div>
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${card.iconBg}`}>
            {card.icon}
          </div>
        </div>
      ))}
    </div>
  );
}