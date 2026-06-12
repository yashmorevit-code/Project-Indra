import { useState } from 'react';
import { LayoutDashboard, Map, ShieldAlert, Bell, PieChart, FileText, Settings, LogOut, CloudRain, ChevronDown, ChevronUp, X } from 'lucide-react';

export default function Sidebar({ isDarkMode = true, isOpen, setIsOpen, activeView, setActiveView, faultCount, onLogout }) {
  const [reportsOpen, setReportsOpen] = useState(true);

  const bgClass = isDarkMode ? "bg-[#0B1121] border-slate-800" : "bg-white border-slate-200";
  const textClass = isDarkMode ? "text-slate-300" : "text-slate-600";
  const hoverClass = isDarkMode ? "hover:bg-slate-800/40 hover:text-slate-100" : "hover:bg-slate-50 hover:text-slate-900";

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: "Dashboard" },
    { icon: <Map size={20} />, label: "Streetlight Map" },
    { icon: <ShieldAlert size={20} />, label: "Fault Detection" },
    { icon: <PieChart size={20} />, label: "Analytics & Charts" },
  ];

  const handleNavClick = (view) => {
    setActiveView(view);
    if (window.innerWidth < 1024) setIsOpen(false); 
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 border-r flex flex-col z-50 transition-transform duration-300 ease-in-out ${bgClass} ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between p-6 mb-2">
          
          <div className="flex items-center gap-3">
            {/* UPDATED LOGO IMAGE PATH */}
            <div className="h-9 w-9 shrink-0 rounded-[10px] overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-slate-700/50">
              <img 
                src="/logo.jpg" 
                alt="Project Indra Logo" 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className={`font-bold text-[15px] block leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Project Indra</span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest mt-1.5 block">Fault Detection</span>
            </div>
          </div>
          
          <button onClick={() => setIsOpen(false)} className="lg:hidden text-slate-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 space-y-1.5 px-5 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
          {menuItems.map((item) => {
            const isActive = activeView === item.label;
            return (
              <button 
                key={item.label}
                onClick={() => handleNavClick(item.label)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] transition-all ${
                  isActive 
                    ? 'font-semibold bg-[#171b36] text-indigo-400 border border-indigo-500/30 shadow-sm' 
                    : `font-medium ${textClass} ${hoverClass} border border-transparent`
                }`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}

          <button 
            onClick={() => handleNavClick("Alerts")}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] transition-all border border-transparent ${
              activeView === "Alerts" ? 'font-semibold bg-[#171b36] text-indigo-400 border-indigo-500/30 shadow-sm' : `font-medium ${textClass} ${hoverClass}`
            }`}
          >
            <div className="flex items-center gap-3"><Bell size={20} /> Alerts</div>
            <span className={`${faultCount > 0 ? 'bg-[#f43f5e]' : 'bg-slate-600'} text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm`}>
              {faultCount}
            </span>
          </button>

          <div className="pt-2">
            <button onClick={() => setReportsOpen(!reportsOpen)} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all border border-transparent ${textClass} ${hoverClass}`}>
              <div className="flex items-center gap-3"><FileText size={20} /> Reports</div>
              {reportsOpen ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${reportsOpen ? 'max-h-40 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
              <div className="pl-11 pr-3 py-1.5 space-y-1">
                 {['Uptime Report', 'Energy Usage', 'Maintenance Logs'].map(subItem => (
                   <button 
                     key={subItem} onClick={() => handleNavClick(subItem)}
                     className={`w-full text-left text-[13.5px] font-medium py-1.5 transition-colors flex items-center gap-2 ${
                       activeView === subItem ? 'text-indigo-400 font-semibold' : (isDarkMode ? 'text-slate-400 hover:text-indigo-400' : 'text-slate-500 hover:text-indigo-600')
                     }`}
                   >
                     <span className="text-[18px] leading-none mb-1">•</span> {subItem}
                   </button>
                 ))}
              </div>
            </div>
          </div>

          <button onClick={() => handleNavClick("Settings")} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all mt-2 border border-transparent ${textClass} ${hoverClass}`}>
            <Settings size={20} /> Settings
          </button>
          
          <div className="pt-6 mb-4">
              <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-all border border-transparent text-rose-500 hover:bg-rose-500/10`}>
                  <LogOut size={20} /> Logout
              </button>
          </div>
        </nav>

        <div className={`p-4 mx-5 mb-5 rounded-xl border transition-colors ${isDarkMode ? 'bg-[#111827] border-slate-800/50 shadow-lg' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3">
              <CloudRain size={26} className="text-blue-500" />
              <div>
                  <p className={`font-bold text-[17px] leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>24°C</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Light Rain, Mumbai</p>
              </div>
          </div>
          <div className="text-[10px] text-slate-400 space-y-1.5 pt-2 border-t border-slate-700/50">
              <div className="flex justify-between items-center"><span>Humidity:</span> <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>82%</span></div>
              <div className="flex justify-between items-center"><span>Wind:</span> <span className={`font-medium ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>12 km/h</span></div>
          </div>
        </div>
      </aside>
    </>
  );
}