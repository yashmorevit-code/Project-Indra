import { ShieldAlert, MapPin, Clock } from 'lucide-react';

export default function AlertsView({ poles, isDarkMode }) {
  const activeAlerts = poles.filter(p => p.status === "Faulty");

  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-xl font-bold ${textPrimary}`}>Active System Alerts</h2>
          <p className={`text-sm mt-1 ${textSecondary}`}>Real-time issues requiring immediate maintenance.</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
          <ShieldAlert size={16} />
          {activeAlerts.length} Critical
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className={`p-12 rounded-xl border text-center ${bgTheme}`}>
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
            <ShieldAlert size={32} className="text-emerald-500" />
          </div>
          <h3 className={`text-lg font-bold ${textPrimary}`}>All Systems Operational</h3>
          <p className={textSecondary}>No active faults detected in the cluster.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeAlerts.map(alert => (
            <div key={alert.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-4 sm:items-center justify-between transition-colors ${bgTheme}`}>
              <div className="flex items-start gap-4">
                <div className="bg-rose-500/10 p-2.5 rounded-lg border border-rose-500/20 mt-1 sm:mt-0">
                  <ShieldAlert size={20} className="text-rose-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold text-lg ${textPrimary}`}>{alert.id}</span>
                    <span className="bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold">
                      {alert.faultType}
                    </span>
                  </div>
                  <div className={`flex flex-wrap items-center gap-3 mt-1.5 text-xs ${textSecondary}`}>
                    <span className="flex items-center gap-1"><MapPin size={12} /> {alert.location}, {alert.area}</span>
                    <span className="flex items-center gap-1"><Clock size={12} /> Detected: {alert.lastUpdate}</span>
                  </div>
                </div>
              </div>
              <button className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap">
                Dispatch Technician
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}