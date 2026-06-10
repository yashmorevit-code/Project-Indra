import { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, addDoc, query, orderBy } from 'firebase/firestore';
import { db } from './firebase';

import Sidebar from './components/Sidebar';
import StatsOverview from './components/StatsOverview';
import MapPlaceholder from './components/MapPlaceholder';
import FaultPanel from './components/FaultPanel';
import HistoryPanel from './components/HistoryPanel';
import AnalyticsPanel from './components/AnalyticsPanel';
import PoleDetailCard from './components/PoleDetailCard';
import AddPoleModal from './components/AddPoleModal';
import AlertsView from './components/AlertsView';
import { Search, Moon, Sun, User, RotateCcw, PlusCircle, Printer, Menu } from 'lucide-react';

const DEFAULT_FILTERS = { search: "", area: "All Areas", street: "All Streets", status: "All Status", faultType: "All Fault Types" };

export default function App() {
  const [poles, setPoles] = useState([]);
  const [history, setHistory] = useState([]);
  
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedPole, setSelectedPole] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState("Dashboard");

  // Calculate dynamic active faults for the notification badge
  const activeFaultCount = poles.filter(p => p.status === "Faulty").length;

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

  const handleConfirmAddPole = async (formData) => {
    try {
      await addDoc(collection(db, 'streetlights'), {
        id: formData.id,
        location: formData.location,
        area: formData.area,
        status: "Working",
        faultType: "None",
        voltage: 230,
        current: 0.45,
        uptime: 100.0,
        lastUpdate: new Date().toLocaleString('en-IN', { day:'2-digit', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }),
        baseLeft: Math.floor(Math.random() * 55) + 20, 
        baseTop: Math.floor(Math.random() * 55) + 20
      });
    } catch (error) {
      console.error("Firestore error: ", error);
    }
  };

  const handlePrint = () => window.print();
  const updateFilter = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const resetFilters = () => { setFilters(DEFAULT_FILTERS); setSelectedPole(null); };

  const filteredPoles = useMemo(() => {
    return poles.filter(pole => {
      const matchSearch = !filters.search || pole.id.toLowerCase().includes(filters.search.toLowerCase());
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
      
      <main className="flex-1 min-w-0 p-3 md:p-6 lg:pl-64 transition-all duration-300">
        
        {/* Header */}
        <header className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 p-4 rounded-xl border ${headerTheme}`}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button onClick={() => setIsSidebarOpen(true)} className={`lg:hidden p-1 rounded-md ${isDarkMode ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
              <Menu size={24} className={isDarkMode ? 'text-slate-300' : 'text-slate-700'} />
            </button>
            <div className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent">
              {activeView}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 w-full sm:w-auto justify-end">
            <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-600 border-indigo-200 hover:bg-indigo-100'}`}>
              <PlusCircle size={14} /> <span className="hidden sm:inline">Add Pole</span>
            </button>
            <button onClick={handlePrint} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${isDarkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
              <Printer size={14} /> <span className="hidden sm:inline">Print</span>
            </button>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="focus:outline-none transition-transform hover:scale-110">
              {isDarkMode ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} className="text-slate-600" />}
            </button>
            <div className={`flex items-center gap-3 pl-3 border-l cursor-pointer ${isDarkMode ? 'border-slate-700' : 'border-slate-300'}`}>
              <div className="h-8 w-8 bg-indigo-600 rounded-full flex items-center justify-center shadow-md">
                <User size={16} className="text-white" />
              </div>
              <div className="hidden md:block text-sm">
                <p className={`font-medium leading-none ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Admin</p>
                <p className="text-slate-500 text-xs mt-1">Super Admin</p>
              </div>
            </div>
          </div>
        </header>

        {/* View Router */}
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
                <select value={filters.status} onChange={e => updateFilter("status", e.target.value)} className={`px-3 py-2.5 md:py-2 rounded-lg text-sm md:text-xs border focus:outline-none ${inputTheme}`}><option>All Status</option><option>Working</option><option>Faulty</option></select>
                <button onClick={resetFilters} className={`col-span-2 md:col-span-1 flex justify-center items-center gap-2 px-4 py-2.5 md:py-2 rounded-lg text-sm md:text-xs font-medium transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}><RotateCcw size={14} /> Reset</button>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 items-start">
              <div className="lg:col-span-2">
                <MapPlaceholder poles={filteredPoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} />
              </div>
              <div className="flex flex-col gap-4 w-full">
                {selectedPole && <PoleDetailCard pole={selectedPole} onClose={() => setSelectedPole(null)} isDarkMode={isDarkMode} />}
                <FaultPanel poles={filteredPoles} isDarkMode={isDarkMode} />
              </div>
            </div>
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

        {["Uptime Report", "Energy Usage", "Settings"].includes(activeView) && (
          <div className={`p-10 rounded-xl border flex flex-col items-center justify-center text-center h-64 ${headerTheme}`}>
            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>{activeView}</h2>
            <p className="text-slate-500">This module is currently under development.</p>
          </div>
        )}

        <AddPoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleConfirmAddPole} isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}