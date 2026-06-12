import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function FaultPanel({ poles, isDarkMode }) {
  const anomalies = poles.filter(p => p.status === "Down");
  
  const containerBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-slate-300" : "text-slate-700";
  const textSecondary = isDarkMode ? "text-slate-500" : "text-slate-500";
  const borderBottom = isDarkMode ? "border-slate-800/50" : "border-slate-200";

  // Sends the timestamp to Firestore when Admin clicks the button
  const handleDispatch = async (poleId) => {
    try {
      const poleRef = doc(db, 'streetlights', poleId);
      await updateDoc(poleRef, {
        dispatchedAt: Date.now() // This timestamp triggers the employee alarm
      });
    } catch (err) {
      console.error("Error dispatching:", err);
    }
  };

  return (
    <div className={`p-4 rounded-xl border flex flex-col w-full h-full transition-colors duration-300 ${containerBg}`}>
      <div className="flex justify-between items-center mb-4 shrink-0">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Fault Detection Panel</h3>
        <span className="text-[10px] text-indigo-500 font-medium cursor-pointer hover:underline">View All</span>
      </div>
      
      <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden pr-1">
        <table className="w-full text-left text-xs relative">
          <thead className={`${textSecondary} border-b ${borderBottom} sticky top-0 ${isDarkMode ? 'bg-[#111827]' : 'bg-white'}`}>
            <tr>
              <th className="pb-2 font-medium">Pole No.</th>
              <th className="pb-2 font-medium">Street</th>
              <th className="pb-2 font-medium">Priority</th>
              <th className="pb-2 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody className={`${textPrimary} divide-y ${isDarkMode ? 'divide-slate-800/50' : 'divide-slate-100'}`}>
            {anomalies.map(pole => (
              <tr key={pole.id} className={isDarkMode ? 'hover:bg-slate-800/30' : 'hover:bg-slate-50'}>
                <td className="py-3 text-indigo-500 font-mono font-medium">{pole.id}</td>
                <td className="py-3">{pole.location}</td>
                <td className="py-3">
                  <span className="px-2 py-0.5 rounded font-medium text-[9px] border bg-rose-500/10 text-rose-500 border-rose-500/20">
                    High
                  </span>
                </td>
                <td className="py-3 text-right">
                  {/* The new Dispatch Button */}
                  <button 
                    onClick={() => handleDispatch(pole.id)}
                    className="px-3 py-1.5 rounded-md font-semibold text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all active:scale-95"
                  >
                    Dispatch Tech
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {anomalies.length === 0 && (
          <p className="text-center text-sm mt-12 text-emerald-500 font-medium">No faults detected. Network is stable.</p>
        )}
      </div>
    </div>
  );
}