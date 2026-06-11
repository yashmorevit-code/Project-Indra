import { Activity } from 'lucide-react';

export default function UptimeReport({ poles, isDarkMode }) {
  // Sort poles from lowest uptime to highest to highlight issues
  const sortedPoles = [...poles].sort((a, b) => a.uptime - b.uptime);
  
  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-xl border ${bgTheme}`}>
      <div className="flex items-center gap-3 mb-8 border-b pb-4 border-slate-500/20">
        <div className="bg-blue-500/10 p-2 rounded-lg border border-blue-500/20">
          <Activity className="text-blue-500" size={20} />
        </div>
        <div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>System Uptime Report</h2>
          <p className={`text-xs mt-1 ${textSecondary}`}>30-Day trailing operational availability per node.</p>
        </div>
      </div>
      
      <div className="space-y-5">
        {sortedPoles.map(pole => (
          <div key={pole.id} className="flex items-center justify-between">
            <div className="w-32">
              <p className={`font-bold font-mono ${textPrimary}`}>{pole.id}</p>
              <p className={`text-[10px] uppercase tracking-wider ${textSecondary}`}>{pole.area}</p>
            </div>
            <div className="flex-1 mx-6">
              <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-[#0A0F1C] border border-slate-800' : 'bg-slate-100 border border-slate-200'}`}>
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ${pole.uptime > 95 ? 'bg-emerald-500' : pole.uptime > 90 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                  style={{ width: `${pole.uptime}%` }}
                ></div>
              </div>
            </div>
            <div className={`w-16 text-right font-mono font-bold text-sm ${pole.uptime > 95 ? 'text-emerald-500' : pole.uptime > 90 ? 'text-amber-500' : 'text-rose-500'}`}>
              {pole.uptime}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}