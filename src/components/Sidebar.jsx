import { useState } from 'react';
import { LayoutDashboard, Map, ShieldAlert, Bell, PieChart, FileText, Settings, LogOut, CloudRain, ChevronDown, X } from 'lucide-react';

export default function Sidebar({ isDarkMode = true, isOpen, setIsOpen }) {
  const [reportsOpen, setReportsOpen] = useState(false);

  const bgClass = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200";
  const textClass = isDarkMode ? "text-slate-400" : "text-slate-600";
  const hoverClass = isDarkMode ? "hover:bg-slate-800/50 hover:text-slate-200" : "hover:bg-slate-50 hover:text-slate-900";

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed top-0 left-0 h-full w-64 border-r flex flex-col z-50 transition-transform duration-300 ease-in-out ${bgClass} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 mb-2">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-white shadow-[0_0_15px_rgba(99,102,241,0.5)]">
              IN
            </div>
            <div>
              <span className={`font-bold text-base block leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Project Indra</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1 block">Fault Detection</span>
            </div>
          </div>
          {/* Mobile Close Button */}
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1 px-3 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600/10 text-indigo-500 border border-indigo-500/20">
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}>
            <Map size={18} /> Streetlight Map
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}>
            <ShieldAlert size={18} /> Fault Detection
          </button>
          <button className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}>
            <div className="flex items-center gap-3"><Bell size={18} /> Alerts</div>
            <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">5</span>
          </button>
          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}>
            <PieChart size={18} /> Analytics & Charts
          </button>

          <div className="pt-2">
            <button 
              onClick={() => setReportsOpen(!reportsOpen)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}
            >
              <div className="flex items-center gap-3"><FileText size={18} /> Reports</div>
              <ChevronDown size={14} className={`transition-transform ${reportsOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {reportsOpen && (
              <div className="pl-10 pr-3 py-2 space-y-2">
                 <button className={`w-full text-left text-xs font-medium py-1.5 transition-colors ${textClass} hover:text-indigo-400`}>• Uptime Report</button>
                 <button className={`w-full text-left text-xs font-medium py-1.5 transition-colors ${textClass} hover:text-indigo-400`}>• Energy Usage</button>
                 <button className={`w-full text-left text-xs font-medium py-1.5 transition-colors ${textClass} hover:text-indigo-400`}>• Maintenance Logs</button>
              </div>
            )}
          </div>

          <button className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${textClass} ${hoverClass}`}>
            <Settings size={18} /> Settings
          </button>
          
          <div className="pt-8 mb-4">
              <button className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium ${textClass} ${hoverClass}`}>
                  <LogOut size={18} /> Logout
              </button>
          </div>
        </nav>

        <div className={`p-4 m-4 rounded-xl border transition-colors ${isDarkMode ? 'bg-[#0A0F1C] border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3">
              <CloudRain size={28} className="text-blue-500" />
              <div>
                  <p className={`font-bold text-lg leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>24°C</p>
                  <p className="text-xs text-slate-500">Light Rain, Mumbai</p>
              </div>
          </div>
          <div className="text-[10px] text-slate-500 space-y-1">
              <div className="flex justify-between"><span>Humidity:</span> <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>82%</span></div>
              <div className="flex justify-between"><span>Wind:</span> <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>12 km/h</span></div>
          </div>
        </div>
      </aside>
    </>
  );
}