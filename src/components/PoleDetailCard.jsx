import { X } from 'lucide-react';

export default function PoleDetailCard({ pole, onClose, isDarkMode }) {
  if (!pole) return null;

  const bgTheme = isDarkMode ? 'bg-[#1e293b] border-slate-700' : 'bg-white border-slate-200 shadow-sm';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  return (
    <div className={`p-4 rounded-xl border relative transition-colors duration-300 ${bgTheme}`}>
      {/* Close Button */}
      <button 
        onClick={onClose}
        className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${isDarkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-600'}`}
      >
        <X size={16} />
      </button>

      <h3 className={`text-xs font-semibold uppercase tracking-wider mb-4 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>
        Pole Details
      </h3>

      <div className="space-y-3 text-xs">
        <div className="flex justify-between border-b pb-2 border-slate-500/20">
          <span className={textSecondary}>Pole No.</span>
          <span className={`font-bold ${textPrimary}`}>{pole.id}</span>
        </div>
        <div className="flex justify-between">
          <span className={textSecondary}>Street</span>
          <span className={`font-medium ${textPrimary}`}>{pole.location}</span>
        </div>
        <div className="flex justify-between">
          <span className={textSecondary}>Area</span>
          <span className={`font-medium ${textPrimary}`}>{pole.area}</span>
        </div>
        <div className="flex justify-between">
          <span className={textSecondary}>Status</span>
          <span className={pole.status === "Working" ? "text-emerald-500 font-bold" : "text-rose-500 font-bold"}>{pole.status}</span>
        </div>
        <div className="flex justify-between">
          <span className={textSecondary}>Fault Type</span>
          <span className={`font-medium ${textPrimary}`}>{pole.faultType}</span>
        </div>
        <div className="flex justify-between pt-1">
          <span className={textSecondary}>Last Update</span>
          <span className={`font-medium text-right ${textPrimary}`}>{pole.lastUpdate}</span>
        </div>
      </div>
      
      <div className="mt-4 pt-3 border-t border-slate-500/20">
        <button className="text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1 transition-colors text-xs">
          View Details &rarr;
        </button>
      </div>
    </div>
  );
}