import { useState, useEffect, useMemo, useRef } from 'react';
import { collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc } from 'firebase/firestore';
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
import { Search, Moon, Sun, User, RotateCcw, PlusCircle, Printer, Menu, Wifi, CloudOff, Trash2 } from 'lucide-react';

const DEFAULT_FILTERS = { search: "", area: "All Areas", street: "All Streets", status: "All Status" };

export default function App() {
  const [poles, setPoles] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPole, setSelectedPole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Dashboard");

  const [tsChannel, setTsChannel] = useState(() => localStorage.getItem('tsChannel') || "3404790");
  const [tsKey, setTsKey] = useState(() => localStorage.getItem('tsKey') || "PBAPC23KVHFVONHY");
  const [isPolling, setIsPolling] = useState(() => localStorage.getItem('isPolling') === 'true');
  const [syncStatus, setSyncStatus] = useState("Waiting...");
  
  const lastEntryRef = useRef(null);
  const activeFaultCount = poles.filter(p => p.status === "Down").length;

  useEffect(() => {
    localStorage.setItem('tsChannel', tsChannel);
    localStorage.setItem('tsKey', tsKey);
    localStorage.setItem('isPolling', isPolling);
  }, [tsChannel, tsKey, isPolling]);

  useEffect(() => {
    const unsubscribePoles = onSnapshot(collection(db, 'streetlights'), (snapshot) => {
      const poleData = snapshot.docs.map(doc => ({ firebaseId: doc.id, ...doc.data() }));
      setPoles(poleData);
    });

    const historyQuery = query(collection(db, 'maintenance_logs'), orderBy('detected_on', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      const logData = snapshot.docs.map(doc => ({ fault_id: doc.id, ...doc.data() }));
      setHistory(logData);
    });

    return () => {
      unsubscribePoles(); 
      unsubscribeHistory();
    };
  }, []);

  useEffect(() => {
    let intervalId;

    const pollThingSpeak = async () => {
      if (!tsChannel || !tsKey) return;
      
      try {
        const res = await fetch(`https://api.thingspeak.com/channels/${tsChannel}/feeds.json?api_key=${tsKey}&results=1`);
        const data = await res.json();
        console.log("ThingSpeak response:", data.feeds);
        if (data.feeds && data.feeds.length > 0) {
          const latest = data.feeds[0];
          
          if (latest.entry_id === lastEntryRef.current) {
            setSyncStatus(`Checked at ${new Date().toLocaleTimeString()} (No changes)`);
            return; 
          }
          
          lastEntryRef.current = latest.entry_id;
          
          const hardwarePoleId = latest.field1;
          const hardwareStatus = latest.field2;
          
          if (hardwarePoleId && hardwareStatus) {
            const formattedPoleId = hardwarePoleId.toString().startsWith('P-') ? hardwarePoleId : `P-${hardwarePoleId}`;
            const currentStatus = hardwareStatus.toString() === "1" ? "Down" : "Up";

            const poleRef = doc(db, 'streetlights', formattedPoleId);
            
            await setDoc(poleRef, {
              id: formattedPoleId,
              status: currentStatus,
              location: "Auto-Detected Node", 
              area: "Unassigned Zone",
              uptime: currentStatus === "Up" ? 100 : 99.9,
              lastUpdate: new Date(latest.created_at).toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
              baseLeft: Math.floor(Math.random() * 55) + 20,
              baseTop: Math.floor(Math.random() * 55) + 20
            }, { merge: true });

            setSyncStatus(`Updated ${formattedPoleId} to ${currentStatus}`);
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
      intervalId = setInterval(pollThingSpeak, 15000);
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
        console.error("Failed to delete poles", err);
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

  return (
    <div className={`flex min-h-screen font-sans transition-colors duration-300 ${bgTheme}`}>
      <Sidebar 
        isDarkMode={isDarkMode} 
        isOpen={isSidebarOpen} 
        setIsOpen={setIsSidebarOpen} 
        activeView={activeView} 
        setActiveView={setActiveView} 
        faultCount={activeFaultCount}
      />
      
      <main className="flex-1 min-w-0 p-4 md:p-8 lg:pl-[280px] transition-all duration-300">
        
        <header className={`flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-6 p-4 rounded-xl border ${headerTheme}`}>
          <div className="flex items-center gap-3 w-full xl:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-1 rounded-md ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Menu size={24} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
            </button>
            <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {activeView}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            
            <span className={`text-[10px] font-mono tracking-wider px-2 hidden sm:block ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              {syncStatus}
            </span>

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${isDarkMode ? 'bg-[#0A0F1C] border-slate-700' : 'bg-slate-50 border-slate-300'}`}>
              <input 
                type="text" 
                placeholder="Channel ID" 
                value={tsChannel} 
                onChange={(e) => setTsChannel(e.target.value)}
                className={`w-24 text-xs bg-transparent focus:outline-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`} 
              />
              <div className="w-px h-4 bg-slate-500/30"></div>
              <input 
                type="text" 
                placeholder="Read API Key" 
                value={tsKey} 
                onChange={(e) => setTsKey(e.target.value)}
                className={`w-36 text-xs bg-transparent focus:outline-none ${isDarkMode ? 'text-slate-200' : 'text-slate-900'}`} 
              />
              <button 
                onClick={() => setIsPolling(!isPolling)}
                className={`flex items-center gap-1 px-2 py-1 text-[10px] font-bold uppercase tracking-wider rounded transition-colors ${
                  isPolling ? 'bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30' : 'bg-rose-500/20 text-rose-500 hover:bg-rose-500/30'
                }`}
              >
                {isPolling ? <><Wifi size={12} /> Syncing</> : <><CloudOff size={12} /> Stopped</>}
              </button>
            </div>

            <div className="hidden sm:block w-px h-8 bg-slate-500/30 mx-1"></div>

            <button onClick={handleNukeDatabase} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border bg-rose-500/20 text-rose-500 border-rose-500/30 hover:bg-rose-500/40">
              <Trash2 size={14} /> <span className="hidden sm:inline">Nuke Data</span>
            </button>

            <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
              <PlusCircle size={14} /> <span className="hidden sm:inline">Add Pole</span>
            </button>
            <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <Printer size={14} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="focus:outline-none transition-transform hover:scale-110">
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
          </div>
        </header>

        {activeView === "Dashboard" && (
          <>
            <StatsOverview poles={filteredPoles} isDarkMode={isDarkMode} />
            <div className={`mb-4 p-3 rounded-xl border flex flex-col md:flex-row flex-wrap gap-3 items-stretch md:items-center ${headerTheme}`}>
              <div className="relative flex-1 min-w-full md:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search Pole No..." value={filters.search} onChange={e => updateFilter("search", e.target.value)} className={`w-full pl-9 pr-3 py-2.5 md:py-2 rounded-lg text-sm md:text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${inputTheme}`} />
              </div>
              <div className="grid grid-cols-2 md:flex gap-3 w-full md:w-auto">
                <select value={filters.area} onChange={e => updateFilter("area", e.target.value)} className={`px-3 py-2.5 md:py-2 rounded-lg text-sm md:text-xs border focus:outline-none ${inputTheme}`}><option>All Areas</option><option>North Zone</option><option>Central Zone</option><option>South Zone</option><option>Transit Zone</option></select>
                <select value={filters.street} onChange={e => updateFilter("street", e.target.value)} className={`px-3 py-2.5 md:py-2 rounded-lg text-sm md:text-xs border focus:outline-none ${inputTheme}`}><option>All Streets</option><option>Main Road</option><option>MG Road</option><option>Park Street</option><option>Station Road</option></select>
                <select value={filters.status} onChange={e => updateFilter("status", e.target.value)} className={`px-3 py-2.5 md:py-2 rounded-lg text-sm md:text-xs border focus:outline-none ${inputTheme}`}><option>All Status</option><option>Up</option><option>Down</option></select>
                <button onClick={resetFilters} className={`col-span-2 md:col-span-1 flex justify-center items-center gap-2 px-4 py-2.5 md:py-2 rounded-lg text-sm md:text-xs font-medium transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}><RotateCcw size={14} /> Reset</button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:h-[420px]">
              <div className="lg:col-span-2 h-[350px] lg:h-full">
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
                  <UptimeChart isDarkMode={isDarkMode} />
                </div>
                <div className="w-full h-[220px]">
                  <EnergyChart isDarkMode={isDarkMode} />
                </div>
              </div>
            )}
          </>
        )}

        {activeView === "Streetlight Map" && (
          <div className="h-[75vh]">
            <MapPlaceholder poles={filteredPoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} />
          </div>
        )}

        {activeView === "Fault Detection" && (
          <FaultPanel poles={filteredPoles} isDarkMode={isDarkMode} />
        )}

        {activeView === "Alerts" && (
          <AlertsView poles={poles} isDarkMode={isDarkMode} />
        )}

        {activeView === "Analytics & Charts" && (
          <AnalyticsPanel isDarkMode={isDarkMode} poles={poles} />
        )}

        {activeView === "Maintenance Logs" && (
          <HistoryPanel history={history} isDarkMode={isDarkMode} />
        )}

        {activeView === "Settings" && (
          <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
        )}

        {activeView === "Uptime Report" && (
          <UptimeReport poles={poles} isDarkMode={isDarkMode} />
        )}

        {activeView === "Energy Usage" && (
          <EnergyUsage poles={poles} isDarkMode={isDarkMode} />
        )}

        <AddPoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}