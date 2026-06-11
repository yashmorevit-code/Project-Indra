import { ShieldAlert, MapPin, Clock, CheckCircle } from 'lucide-react';

export default function AlertsView({ poles, isDarkMode }) {
  // UPDATED: Syncing with "Down" data
  const activeAlerts = poles.filter(p => p.status === "Down");

  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={`text-2xl font-bold ${textPrimary}`}>Active System Alerts</h2>
          <p className={`text-sm mt-1 ${textSecondary}`}>Nodes currently reporting a disconnected state.</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow-sm">
          <ShieldAlert size={18} />
          {activeAlerts.length} Action Required
        </div>
      </div>

      {activeAlerts.length === 0 ? (
        <div className={`p-16 rounded-xl border text-center transition-colors ${bgTheme}`}>
          <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 mb-5 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <CheckCircle size={40} className="text-emerald-500" />
          </div>
          <h3 className={`text-xl font-bold ${textPrimary}`}>All Systems Operational</h3>
          <p className={`mt-2 ${textSecondary}`}>No active faults detected in the cluster. Great job!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeAlerts.map(alert => (
            <div key={alert.id} className={`p-5 rounded-xl border flex flex-col md:flex-row gap-5 md:items-center justify-between transition-colors ${bgTheme}`}>
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl border mt-1 md:mt-0 bg-rose-500/10 border-rose-500/20 text-rose-500`}>
                  <ShieldAlert size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <span className={`font-bold text-lg ${textPrimary}`}>{alert.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wider font-bold bg-rose-500 text-white`}>
                      OFFLINE
                    </span>
                  </div>
                  <div className={`flex flex-wrap items-center gap-4 mt-2 text-xs font-medium ${textSecondary}`}>
                    <span className="flex items-center gap-1.5"><MapPin size={14} /> {alert.location}, {alert.area}</span>
                    <span className="flex items-center gap-1.5"><Clock size={14} /> Last seen: {alert.lastUpdate}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 w-full md:w-auto mt-2 md:mt-0">
                <button className={`flex-1 md:flex-none px-4 py-2.5 text-xs font-semibold rounded-lg border transition-colors ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}>
                  View Details
                </button>
                <button className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-md">
                  Dispatch Technician
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}