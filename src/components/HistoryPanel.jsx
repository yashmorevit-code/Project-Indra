import { ClipboardList } from "lucide-react";

const fmt = (iso) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", { 
    day: "2-digit", 
    month: "short", 
    year: "numeric", 
    hour: "2-digit", 
    minute: "2-digit" 
  });
};


export default function HistoryPanel({ history, isDarkMode }) {
  const containerBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-300" : "text-slate-700";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-400";
  const tableHeaderBg = isDarkMode ? "bg-[#111827]" : "bg-slate-50";
  const borderTheme = isDarkMode ? "border-slate-800" : "border-slate-200";

  // Status mapping logic using pure Tailwind badges
  const getStatusBadge = (status) => {
    switch(status) {
      case "Closed":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "In Progress":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "Open":
      default:
        return "text-rose-400 bg-rose-500/10 border-rose-500/20";
    }
  };

  return (
    <div className={`p-5 rounded-xl border h-[320px] flex flex-col overflow-hidden transition-colors duration-300 ${containerBg}`}>
      <div className="mb-4 flex items-center gap-2">
        <ClipboardList size={16} className="text-indigo-500" />
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
          Maintenance History
        </h3>
      </div>
      
      <div className="flex-1 overflow-auto border border-slate-500/10 rounded-lg">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className={`border-b text-slate-500 font-semibold sticky top-0 z-10 ${tableHeaderBg} ${borderTheme}`}>
              <th className="p-3">Pole No.</th>
              <th className="p-3">Street</th>
              <th className="p-3">Issue</th>
              <th className="p-3">Fault Type</th>
              <th className="p-3">Reported On</th>
              <th className="p-3">Resolved On</th>
              <th className="p-3">Technician</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className={`divide-y ${textPrimary} ${isDarkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
            {history.map((fault) => (
              <tr key={fault.fault_id} className={`transition-colors ${isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50/80'}`}>
                <td className="p-3 font-mono font-bold text-indigo-500">{fault.pole_id}</td>
                <td className="p-3">{fault.street}</td>
                <td className={`p-3 italic max-w-[180px] truncate ${textSecondary}`}>{fault.notes}</td>
                <td className="p-3">{fault.fault_type}</td>
                <td className="p-3 font-mono opacity-80">{fmt(fault.detected_on)}</td>
                <td className="p-3 font-mono opacity-80">{fmt(fault.resolved_on)}</td>
                <td className="p-3 font-medium">{fault.technician}</td>
                <td className="p-3 text-right">
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] border font-medium uppercase tracking-wider ${getStatusBadge(fault.status)}`}>
                    {fault.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {history.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No system log instances compiled.
          </div>
        )}
      </div>
    </div>
  );
}