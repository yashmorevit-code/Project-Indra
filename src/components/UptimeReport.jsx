import { Activity, Download } from 'lucide-react';

export default function UptimeReport({ poles, isDarkMode }) {
  // Group poles by zone
  const zonesMap = {};
  poles.forEach(pole => {
    const zone = pole.area || 'Zone 1';
    if (!zonesMap[zone]) {
      zonesMap[zone] = [];
    }
    zonesMap[zone].push(pole);
  });

  // Sort zones alphabetically
  const sortedZones = Object.keys(zonesMap).sort();

  // Calculate overall system average
  const totalUptime = poles.reduce((acc, curr) => acc + (curr.uptime || 0), 0);
  const systemAvg = poles.length > 0 ? (totalUptime / poles.length).toFixed(1) : '0';

  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700/50' : 'bg-slate-50 border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';
  const borderBottom = isDarkMode ? 'border-slate-800/20' : 'border-slate-200/60';

  // Client-side CSV generator and downloader
  const handleDownloadCSV = () => {
    const headers = ["Pole ID", "Zone", "Location", "Uptime (%)", "Status"];
    const rows = poles.map(p => [
      p.id,
      p.area || 'Zone 1',
      p.location || 'Unknown',
      `${p.uptime || 0}%`,
      p.status === 'Down' || p.status === 1 ? 'Down (Faulty)' : 'Up (Working)'
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Indra_System_Uptime_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`max-w-4xl mx-auto p-6 rounded-xl border ${bgTheme} transition-colors duration-300`}>
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b pb-6 border-slate-500/20 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
            <Activity className="text-blue-500" size={22} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>System Uptime Report</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>30-Day operational availability grouped by zone.</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="hidden md:block text-right">
            <p className={`text-[10px] uppercase font-bold tracking-wider ${textSecondary}`}>System Avg Uptime</p>
            <p className={`text-sm font-extrabold ${parseFloat(systemAvg) > 95 ? 'text-emerald-500' : 'text-amber-500'}`}>{systemAvg}%</p>
          </div>
          <button 
            onClick={handleDownloadCSV}
            className="flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition-all active:scale-95"
          >
            <Download size={14} /> Download CSV
          </button>
        </div>
      </div>

      {/* Main Report Body Grouped by Zone */}
      <div className="space-y-8">
        {sortedZones.map(zoneName => {
          const zonePoles = zonesMap[zoneName];
          const zoneUptimeSum = zonePoles.reduce((acc, curr) => acc + (curr.uptime || 0), 0);
          const zoneAvgUptime = (zoneUptimeSum / zonePoles.length).toFixed(1);

          return (
            <div key={zoneName} className={`p-5 rounded-xl border ${cardBg}`}>
              {/* Zone Header */}
              <div className="flex justify-between items-center mb-6 pb-3 border-b border-slate-500/10">
                <div>
                  <h3 className={`text-sm font-bold ${textPrimary}`}>{zoneName}</h3>
                  <p className={`text-[10px] mt-0.5 ${textSecondary}`}>{zonePoles.length} nodes monitored</p>
                </div>
                <div className={`px-2.5 py-1 rounded-full border text-xs font-bold ${
                  parseFloat(zoneAvgUptime) > 95 
                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' 
                    : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                }`}>
                  Avg Uptime: {zoneAvgUptime}%
                </div>
              </div>

              {/* Zone Poles List */}
              <div className="space-y-4">
                {zonePoles.map(pole => (
                  <div key={pole.id} className="flex items-center justify-between gap-4">
                    <div className="w-24">
                      <p className={`font-bold font-mono text-xs ${textPrimary}`}>{pole.id}</p>
                      <p className={`text-[9px] truncate ${textSecondary}`}>{pole.location || 'MG Road'}</p>
                    </div>
                    <div className="flex-1">
                      <div className={`h-2 w-full rounded-full overflow-hidden ${isDarkMode ? 'bg-[#0A0F1C]' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            pole.uptime > 95 ? 'bg-emerald-500' : pole.uptime > 90 ? 'bg-amber-500' : 'bg-rose-500'
                          }`} 
                          style={{ width: `${pole.uptime || 0}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className={`w-14 text-right font-mono font-bold text-xs ${
                      pole.uptime > 95 ? 'text-emerald-500' : pole.uptime > 90 ? 'text-amber-500' : 'text-rose-500'
                    }`}>
                      {pole.uptime || 0}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}