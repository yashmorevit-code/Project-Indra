import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

// Components
import Sidebar from './components/Sidebar';
import StatsOverview from './components/StatsOverview';
import MapPlaceholder from './components/MapPlaceholder';
import FaultPanel from './components/FaultPanel';
import HistoryPanel from './components/HistoryPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import PoleDetailCard from './components/PoleDetailCard';
import AddPoleModal from './components/AddPoleModal';
import AlertsView from './components/AlertsView';
import SettingsView from './components/SettingsView';
import UptimeReport from './components/UptimeReport';
import EnergyUsage from './components/EnergyUsage';
import { UptimeChart, EnergyChart } from './components/MiniChartsPanel';
import CreateEmployeeModal from './components/CreateEmployee';
import EmployeeDashboard from './components/EmployeeDashboard';

import { Search, Moon, Sun, User, RotateCcw, PlusCircle, Printer, Menu, Wifi, CloudOff, Trash2, UserPlus, LogOut } from 'lucide-react';

const DEFAULT_FILTERS = { search: "", area: "All Areas", street: "All Streets", status: "All Status" };

export default function App() {
  const [poles, setPoles] = useState([]);
  const [faults, setFaults] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPole, setSelectedPole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Dashboard");

  // Traffic State
  const [trafficData, setTrafficData] = useState({ count: 0, density: 1 });

  const [tsChannel, setTsChannel] = useState(() => localStorage.getItem('tsChannel') || "3404790");
  const [tsKey, setTsKey] = useState(() => localStorage.getItem('tsKey') || "XKQE4UZ44V309M9Y");
  const [isPolling, setIsPolling] = useState(() => localStorage.getItem('isPolling') === 'true');
  const [syncStatus, setSyncStatus] = useState("Waiting...");

  const lastEntryRef = useRef(null);
  const lastTrafficEntryRef = useRef(null);

  const activeFaultCount = poles.filter(p => p.status === "Down").length;

  const handleLogin = async (credentials) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', credentials.username));
      if (userDoc.exists() && userDoc.data().password === credentials.password) {
        setUser(userDoc.data());
      } else {
        alert("Invalid credentials.");
      }
    } catch (err) {
      console.error("Auth error:", err);
    }
    setLoading(false);
  };

  useEffect(() => {
    localStorage.setItem('tsChannel', tsChannel);
    localStorage.setItem('tsKey', tsKey);
    localStorage.setItem('isPolling', isPolling);
  }, [tsChannel, tsKey, isPolling]);

  // Firebase Listener
  useEffect(() => {
    const unsubscribePoles = onSnapshot(collection(db, 'streetlights'), (snapshot) => {
      setPoles(snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() })));
    });

    const historyQuery = query(collection(db, 'maintenance_logs'), orderBy('detected_on', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ fault_id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribePoles(); unsubscribeHistory(); };
  }, []);

  // Dual ThingSpeak Polling Engine (Faults + Traffic)
  useEffect(() => {
    let intervalId;
    const pollThingSpeak = async () => {
      if (!tsChannel || !tsKey) return;
      try {
        // 1. Fetch Fault Data
        const faultRes = await fetch(`https://api.thingspeak.com/channels/${tsChannel}/feeds.json?api_key=${tsKey}&results=10`);
        const faultData = await faultRes.json();

        console.log("ThingSpeak Fault Data:", faultData); // Debug log to inspect the structure

        if (faultData.feeds && faultData.feeds.length > 0) {
          // Sync fault readings to NeonDB
          fetch('/api/sync-readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: tsChannel, apiKey: tsKey, type: 'fault', results: 10 })
          }).catch(err => console.error("NeonDB sync error:", err));

          const latestFault = faultData.feeds; // <-- RESTORED the index fix!

          if (latestFault.entry_id !== lastEntryRef.current) {
            lastEntryRef.current = latestFault.entry_id;

            const hardwarePoleId = latestFault.field1;
            const hardwareStatus = latestFault.field2;

            if (hardwarePoleId && hardwareStatus) {
              const formattedPoleId = hardwarePoleId.toString().startsWith('P-') ? hardwarePoleId : `P-${hardwarePoleId}`;
              const currentStatus = hardwareStatus.toString() === "1" ? "Down" : "Up";

              // --- UPDATE 1: The Main Streetlights Collection ---
              const poleRef = doc(db, 'streetlights', formattedPoleId);
              await setDoc(poleRef, {
                id: formattedPoleId,
                status: currentStatus,
                location: "Hardware Node",
                area: "Active Test Zone",
                uptime: currentStatus === "Up" ? 100 : 99.9,
                lastUpdate: new Date(latestFault.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                baseLeft: Math.floor(Math.random() * 55) + 20,
                baseTop: Math.floor(Math.random() * 55) + 20
              }, { merge: true });

              // --- UPDATE 2: The Specific Faults Collection Document ---
              const isFaulty = hardwareStatus.toString() === "1"; // Evaluates to true if fault, false if healthy
              const faultTrackerRef = doc(db, 'faults', 'YJFhA9C7N0Qef2s2w3p3'); // Your exact document ID

              await setDoc(faultTrackerRef, {
                faultStatus: {
                  [hardwarePoleId.toString()]: isFaulty // Updates the specific pole key dynamically
                }
              }, { merge: true }); // Merge ensures other poles in the map are not deleted

              if (currentStatus === "Down") {
                fetch('/api/send-email', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    poleId: formattedPoleId,
                    status: currentStatus,
                    timestamp: new Date(latestFault.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  })
                })
                  .then(res => {
                    if (!res.ok) console.error("Failed to send email alert");
                  })
                  .catch(err => console.error("Error triggering email alert:", err));
              }

              setSyncStatus(`Updated ${formattedPoleId} to ${currentStatus}`);
            }
          } else {
            setSyncStatus(`Checked at ${new Date().toLocaleTimeString()} (No changes)`);
          }
        }

        // 2. Fetch Traffic Data
        const trafficRes = await fetch(`https://api.thingspeak.com/channels/3405925/feeds.json?api_key=HIG3SCTF2JAF0M4X&results=1`);
        const trafficFeed = await trafficRes.json();

        if (trafficFeed.feeds && trafficFeed.feeds.length > 0) {
          // Sync traffic readings to NeonDB
          fetch('/api/sync-readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: '3405925', apiKey: 'HIG3SCTF2JAF0M4X', type: 'traffic', results: 10 })
          }).catch(err => console.error("NeonDB traffic sync error:", err));

          const latestTraffic = trafficFeed.feeds; // <-- RESTORED the index fix!

          if (latestTraffic.entry_id !== lastTrafficEntryRef.current) {
            lastTrafficEntryRef.current = latestTraffic.entry_id;
            setTrafficData({
              count: parseInt(latestTraffic.field1) || 0,
              density: parseInt(latestTraffic.field2) || 1
            });
          }
        }

      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
        setSyncStatus("API Connection Error");
      }
    };

    if (isPolling) {
      setSyncStatus("Connecting...");
      pollThingSpeak();
      intervalId = setInterval(pollThingSpeak, 20000);
    } else {
      setSyncStatus("Stopped");
    }
    return () => clearInterval(intervalId);
  }, [isPolling, tsChannel, tsKey]);

  const handleNukeDatabase = async () => {
    if (window.confirm("WARNING: This will permanently delete ALL poles from Firebase. Use this to clear fake data! Proceed?")) {
      try {
        for (const pole of poles) {
          await deleteDoc(doc(db, 'streetlights', pole.firebaseId));
        }
        alert("Success! Your database is now completely empty.");
      } catch (err) {
        alert("Error wiping database. Check console.");
      }
    }
  };

  const handlePrint = () => window.print();
  const updateFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setSelectedPole(null); };

  const filteredPoles = useMemo(() => {
    return poles.filter(pole => {
      const matchSearch = !filters.search || (pole.id && pole.id.toLowerCase().includes(filters.search.toLowerCase()));
      const matchArea = filters.area === "All Areas" || pole.area === filters.area;
      const matchStreet = filters.street === "All Streets" || pole.location === filters.street;
      const matchStatus = filters.status === "All Status" || pole.status === filters.status;
      return matchSearch && matchArea && matchStreet && matchStatus;
    });
  }, [filters, poles]);

  const bgTheme = isDarkMode ? 'bg-[#0A0F1C] text-slate-300' : 'bg-slate-50 text-slate-800';
  const headerTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const inputTheme = isDarkMode ? 'bg-[#0A0F1C] border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900';

  if (!user) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 ${bgTheme}`}>
        <div className={`p-6 sm:p-8 rounded-xl border max-w-md w-full shadow-2xl ${headerTheme}`}>
          <h2 className={`text-xl sm:text-2xl font-bold mb-6 text-center ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
            Project Indra Login
          </h2>
          <form onSubmit={(e) => { e.preventDefault(); handleLogin({ username: e.target.username.value, password: e.target.password.value }); }} className="space-y-4">
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Username</label>
              <input name="username" type="text" required className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputTheme}`} />
            </div>
            <div>
              <label className={`block text-xs sm:text-sm font-medium mb-1 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Password</label>
              <input name="password" type="password" required className={`w-full px-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputTheme}`} />
            </div>
            <button type="submit" disabled={loading} className="w-full py-3 mt-2 rounded-lg bg-indigo-600 text-white font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-md">
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (user.role === 'employee') {
    return <EmployeeDashboard user={user} poles={poles} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={() => setUser(null)} />;
  }

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${bgTheme}`}>
      <Sidebar isDarkMode={isDarkMode} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} activeView={activeView} setActiveView={setActiveView} faultCount={activeFaultCount} onLogout={() => setUser(null)} />

      <main className="flex-1 min-w-0 p-3 sm:p-4 md:p-8 lg:pl-[280px] transition-all duration-300">
        <header className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 p-3 sm:p-4 rounded-xl border ${headerTheme}`}>
          <div className="flex items-center justify-between w-full xl:w-auto">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-1.5 rounded-md ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                <Menu size={22} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
              </button>
              <div className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
                {activeView}
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="xl:hidden focus:outline-none p-1">
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>

          <div className="flex flex-col md:flex-row flex-wrap items-start md:items-center gap-3 sm:gap-4 w-full xl:w-auto justify-end">
            <div className={`flex flex-wrap sm:flex-nowrap items-center gap-2 px-2.5 py-1.5 rounded-lg border w-full md:w-auto justify-between sm:justify-start ${isDarkMode ? 'bg-[#0A0F1C] border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Ch ID" value={tsChannel} onChange={(e) => setTsChannel(e.target.value)} className={`w-16 sm:w-20 text-xs bg-transparent focus:outline-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`} />
                <div className="w-px h-3 bg-slate-500/30"></div>
                <input type="text" placeholder="API Key" value={tsKey} onChange={(e) => setTsKey(e.target.value)} className={`w-24 sm:w-32 text-xs bg-transparent focus:outline-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`} />
              </div>
              <button onClick={() => setIsPolling(!isPolling)} className={`flex items-center gap-1 px-2 py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider rounded transition-colors whitespace-nowrap ${isPolling ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'}`}>
                {isPolling ? <><Wifi size={12} className="hidden sm:block" /> Syncing</> : <><CloudOff size={12} className="hidden sm:block" /> Stopped</>}
              </button>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-3 md:pt-0 border-slate-700/50 md:border-transparent">
              <div className="flex gap-2">
                <button onClick={handleNukeDatabase} className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border bg-rose-500/20 text-rose-500 border-rose-500/30 hover:bg-rose-500/40">
                  <Trash2 size={14} /> <span className="hidden sm:inline">Nuke</span>
                </button>
                <button onClick={() => setIsEmployeeModalOpen(true)} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-600'}`}>
                  <UserPlus size={14} /> <span className="hidden sm:inline">Add Team</span>
                </button>
                <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-600'}`}>
                  <PlusCircle size={14} /> <span className="hidden sm:inline">Add Pole</span>
                </button>
              </div>

              <div className="flex items-center gap-3">
                <button onClick={() => setIsDarkMode(!isDarkMode)} className="hidden xl:block focus:outline-none hover:scale-110">
                  {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
                </button>
                <div className={`flex items-center gap-2 sm:gap-3 pl-0 sm:pl-3 md:border-l ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                    <User size={14} className="text-white" />
                  </div>
                  <div className="hidden md:block text-sm">
                    <p className={`font-medium leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{user?.displayRole || user?.username}</p>
                  </div>
                  <button onClick={() => setUser(null)} className="sm:hidden text-rose-500 p-1 bg-rose-500/10 rounded-md">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {activeView === "Dashboard" && (
          <>
            <StatsOverview poles={filteredPoles} isDarkMode={isDarkMode} trafficData={trafficData} />

            <div className={`mb-4 p-3 rounded-xl border flex flex-col lg:flex-row flex-wrap gap-3 items-stretch lg:items-center ${headerTheme}`}>
              <div className="relative flex-1 min-w-full lg:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search Pole No..." value={filters.search} onChange={e => updateFilter("search", e.target.value)} className={`w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${inputTheme}`} />
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full lg:w-auto">
                <select value={filters.area} onChange={e => updateFilter("area", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Areas</option><option>North Zone</option><option>Central Zone</option><option>South Zone</option><option>Transit Zone</option></select>
                <select value={filters.street} onChange={e => updateFilter("street", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Streets</option><option>Main Road</option><option>MG Road</option><option>Park Street</option><option>Station Road</option></select>
                <select value={filters.status} onChange={e => updateFilter("status", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Status</option><option>Up</option><option>Down</option></select>
                <button onClick={resetFilters} className={`col-span-2 sm:col-span-1 flex justify-center items-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-medium transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}><RotateCcw size={14} /> <span className="sm:hidden">Reset Filters</span></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:h-[420px]">
              <div className="lg:col-span-2 h-[350px] lg:h-full w-full">
                <MapPlaceholder poles={filteredPoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} />
              </div>
              <div className="w-full h-[350px] lg:h-full">
                {selectedPole ? (
                  <PoleDetailCard pole={selectedPole} onClose={() => setSelectedPole(null)} isDarkMode={isDarkMode} />
                ) : (
                  <FaultPanel poles={filteredPoles} isDarkMode={isDarkMode} />
                )}
              </div>
            </div>

            {!selectedPole && (
              <div className="flex flex-col gap-4 mb-4">
                <div className="w-full h-[220px]">
                  <UptimeChart isDarkMode={isDarkMode} poles={filteredPoles} />
                </div>
                <div className="w-full h-[220px]">
                  <EnergyChart isDarkMode={isDarkMode} poles={filteredPoles} />
                </div>
              </div>
            )}
          </>
        )}

        {activeView === "Streetlight Map" && <div className="h-[75vh]"><MapPlaceholder poles={filteredPoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} /></div>}
        {activeView === "Fault Detection" && <FaultPanel poles={filteredPoles} isDarkMode={isDarkMode} />}
        {activeView === "Alerts" && <AlertsView poles={poles} isDarkMode={isDarkMode} />}
        {activeView === "Analytics & Charts" && <AnalyticsPanel isDarkMode={isDarkMode} poles={poles} />}
        {activeView === "Maintenance Logs" && <HistoryPanel history={history} isDarkMode={isDarkMode} />}
        {activeView === "Settings" && <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
        {activeView === "Uptime Report" && <UptimeReport poles={poles} isDarkMode={isDarkMode} />}
        {activeView === "Energy Usage" && <EnergyUsage poles={poles} isDarkMode={isDarkMode} />}

        <AddPoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isDarkMode={isDarkMode} />
        <CreateEmployeeModal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}