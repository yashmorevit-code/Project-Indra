export default function FaultPanel({ poles, isDarkMode }) {
  const anomalies = poles.filter(p => p.status === "Faulty");
  
  const containerBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-300" : "text-slate-700";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-500";
  const borderBottom = isDarkMode ? "border-slate-800/50" : "border-slate-200";

  return (
    <div className={`p-4 rounded-xl border flex-1 transition-colors duration-300 ${containerBg}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Fault Detection Panel</h3>
        <span className="text-[10px] text-indigo-500 font-medium cursor-pointer hover:underline">View All</span>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className={`${textSecondary} border-b ${borderBottom}`}>
            <tr>
              <th className="pb-2 font-medium">Pole No.</th>
              <th className="pb-2 font-medium">Street</th>
              <th className="pb-2 font-medium">Fault Type</th>
              <th className="pb-2 font-medium">Priority</th>
            </tr>
          </thead>
          <tbody className={`${textPrimary} divide-y ${isDarkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
            {anomalies.map(pole => (
              <tr key={pole.id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                <td className="py-3 text-indigo-500 font-mono font-medium">{pole.id}</td>
                <td className="py-3">{pole.location}</td>
                <td className="py-3">{pole.faultType}</td>
                <td className="py-3">
                  <span className={`px-2 py-0.5 rounded font-medium text-[9px] border ${
                    pole.faultType === 'Bulb Failure' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {pole.faultType === 'Bulb Failure' ? 'High' : 'Medium'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {anomalies.length === 0 && (
          <p className="text-center text-sm mt-8 text-emerald-500 font-medium">No faults detected.</p>
        )}
      </div>
    </div>
  );
}