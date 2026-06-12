import { useMemo, useState, useEffect, useRef } from 'react';
import { LayoutDashboard, LogOut, Map, Menu, Moon, ShieldAlert, Sun, User, X, BellRing } from 'lucide-react';
import EmployeeMapPlaceholder from './EmployeeMapPlaceholder';
import EmployeeFaultPanel from './EmployeeFaultPanel';

const employeePages = {
  dashboard: 'Dashboard',
  map: 'Streetlight Map',
  faults: 'Fault Detection',
};

export default function EmployeeDashboard({ user, poles, isDarkMode, setIsDarkMode, onLogout }) {
  const [activePage, setActivePage] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedPole, setSelectedPole] = useState(null);
  
  // Audio & Notification State
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioRef = useRef(null);
  const prevPolesRef = useRef(poles);

  // 1. Initialize Audio and Request Notification Permissions
  useEffect(() => {
    audioRef.current = new Audio('/faaa.mp3');
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2. The Global Unlocker
  const unlockAudioContext = () => {
    if (!audioUnlocked && audioRef.current) {
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        setAudioUnlocked(true);
      }).catch(err => console.log("Audio unlock pending:", err));
    }
  };

  // 3. The Dispatch Listener
  useEffect(() => {
    const newlyDispatchedPole = poles.find(pole => {
      const oldPole = prevPolesRef.current.find(p => p.id === pole.id);
      return pole.dispatchedAt && (!oldPole || oldPole.dispatchedAt !== pole.dispatchedAt);
    });

    if (newlyDispatchedPole) {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("🚨 DISPATCH ALERT", {
          body: `Immediate maintenance required at ${newlyDispatchedPole.id} (${newlyDispatchedPole.location}).`,
          icon: "/logo.jpg"
        });
      }

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(err => console.warn("Audio blocked by browser. User must interact with UI first.", err));
      }
    }

    prevPolesRef.current = poles;
  }, [poles]);

  const theme = {
    bg: isDarkMode ? 'bg-[#0A0F1C] text-slate-300' : 'bg-slate-50 text-slate-800',
    panel: isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm',
    text: isDarkMode ? 'text-white' : 'text-slate-900',
    nav: isDarkMode ? 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
  };

  const employeePoles = useMemo(() => {
    return poles.map((pole) => ({
      ...pole,
      status: pole.status === 'Faulty' || pole.status === 'Down' ? 'Down' : 'Up',
      uptime: pole.uptime ?? (pole.status === 'Faulty' || pole.status === 'Down' ? 62 : 100),
      baseLeft: pole.baseLeft ?? 50,
      baseTop: pole.baseTop ?? 50,
    }));
  }, [poles]);

  const navItem = (page, icon, label) => {
    const isActive = activePage === page;
    return (
      <button
        onClick={() => { setActivePage(page); setIsSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isActive ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20' : theme.nav}`}
      >
        {icon}
        <span className="flex-1 text-left">{label}</span>
      </button>
    );
  };

  const MapPanel = () => (
    <EmployeeMapPlaceholder poles={employeePoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} />
  );

  const FaultPanel = () => (
    <EmployeeFaultPanel poles={employeePoles} isDarkMode={isDarkMode} />
  );

  const Dashboard = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 items-start lg:h-[420px]">
      <div className="lg:col-span-2 h-[350px] lg:h-full w-full">
        <MapPanel />
      </div>
      <div className="w-full h-[350px] lg:h-full">
        <FaultPanel />
      </div>
    </div>
  );

  const renderPage = () => {
    if (activePage === 'map') return <div className="h-[75vh]"><MapPanel /></div>;
    if (activePage === 'faults') return <FaultPanel />;
    return <Dashboard />;
  };

  return (
    <div onClick={unlockAudioContext} className={`flex min-h-screen font-sans transition-colors duration-300 ${theme.bg}`}>
      
      {!audioUnlocked && (
        <div className="fixed bottom-4 right-4 z-50 bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 animate-pulse cursor-pointer">
          <BellRing size={20} />
          <span className="text-sm font-semibold">Click anywhere to enable audio alerts</span>
        </div>
      )}

      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)} />
      )}

      <aside className={`fixed top-0 left-0 h-full w-64 border-r flex flex-col z-50 transition-transform duration-300 ease-in-out ${theme.panel} ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex items-center justify-between px-5 py-6 mb-1 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* UPDATED LOGO IMAGE PATH */}
            <div className="h-9 w-9 shrink-0 rounded-[10px] overflow-hidden shadow-[0_0_15px_rgba(99,102,241,0.3)] border border-slate-700/50">
              <img src="/logo.jpg" alt="Project Indra Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <span className={`font-bold text-base block leading-none ${theme.text}`}>Project Indra</span>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider mt-1.5 block">Employee Console</span>
            </div>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1">
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden min-h-0">
          {navItem('dashboard', <LayoutDashboard size={18} />, 'Dashboard')}
          {navItem('map', <Map size={18} />, 'Streetlight Map')}
          {navItem('faults', <ShieldAlert size={18} />, 'Fault Detection')}
        </nav>

        <div className={`px-4 pb-5 pt-3 border-t flex-shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <User size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${theme.text}`}>{user?.displayRole || user?.username}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role || 'Field Employee'}</p>
            </div>
          </div>
          <button onClick={onLogout} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${isDarkMode ? 'text-rose-400 hover:bg-rose-500/10' : 'text-rose-500 hover:bg-rose-50'}`}>
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-8 lg:pl-[280px] transition-all duration-300">
        
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 rounded-xl border ${theme.panel}`}>
          <div className="flex items-center justify-between w-full sm:w-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-1.5 rounded-md ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                <Menu size={22} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
              </button>
              <div className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {employeePages[activePage]}
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="sm:hidden focus:outline-none p-1">
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>

          <div className="flex items-center justify-between w-full sm:w-auto gap-4">
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="hidden sm:block focus:outline-none hover:scale-110">
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <div className={`flex items-center gap-3 pl-0 sm:pl-4 border-l-0 sm:border-l ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <div className="h-8 w-8 sm:h-9 sm:w-9 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden sm:block text-sm">
                <p className={`font-medium leading-none ${theme.text}`}>{user?.displayRole || user?.username}</p>
                <p className="text-slate-500 text-xs mt-1 capitalize">{user?.role || 'Field Employee'}</p>
              </div>
              <button onClick={onLogout} className="sm:hidden text-rose-500 p-1 bg-rose-500/10 rounded-md">
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </header>

        {renderPage()}
      </main>
    </div>
  );
}