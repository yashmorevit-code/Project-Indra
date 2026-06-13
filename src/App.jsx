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
import TrafficAnalytics from './components/TrafficAnalytics';
import { UptimeChart, EnergyChart } from './components/MiniChartsPanel';
import CreateEmployeeModal from './components/CreateEmployee';
import EmployeeDashboard from './components/EmployeeDashboard';

import { Search, Moon, Sun, User, RotateCcw, PlusCircle, Printer, Menu, Wifi, CloudOff, Trash2, UserPlus, LogOut } from 'lucide-react';

const DEFAULT_FILTERS = { search: "", area: "All Areas", street: "All Streets", status: "All Status" };

const INITIAL_POLES = [
  { id: "P-1", status: 0, area: "Zone 1", location: "MG Road", uptime: 100, baseLeft: 25, baseTop: 30 },
  { id: "P-2", status: 0, area: "Zone 1", location: "Main Road", uptime: 100, baseLeft: 40, baseTop: 15 },
  { id: "P-3", status: 0, area: "Zone 1", location: "Park Street", uptime: 100, baseLeft: 10, baseTop: 45 },
  { id: "P-4", status: 0, area: "Zone 2", location: "Station Road", uptime: 98.2, baseLeft: 70, baseTop: 65 },
  { id: "P-5", status: 1, area: "Zone 2", location: "Main Road", uptime: 92.4, baseLeft: 85, baseTop: 80 },
  { id: "P-6", status: 0, area: "Zone 2", location: "MG Road", uptime: 99.5, baseLeft: 60, baseTop: 75 },
  { id: "P-7", status: 0, area: "Zone 3", location: "Park Street", uptime: 98.9, baseLeft: 45, baseTop: 50 },
  { id: "P-8", status: 0, area: "Zone 3", location: "Station Road", uptime: 99.7, baseLeft: 55, baseTop: 55 },
  { id: "P-9", status: 1, area: "Zone 3", location: "Main Road", uptime: 89.1, baseLeft: 35, baseTop: 65 }
];

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
  const [isPolling, setIsPolling] = useState(() => {
    const stored = localStorage.getItem('isPolling');
    return stored === null ? true : stored === 'true';
  });
  const [secondsUntilFetch, setSecondsUntilFetch] = useState(20);
  const [syncStatus, setSyncStatus] = useState("Waiting...");
  const [isTsOffline, setIsTsOffline] = useState(false);
  const simulatedFeedRef = useRef(null);
  const [triggerPollCount, setTriggerPollCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(Date.now());

  const [hasLoadedSnapshot, setHasLoadedSnapshot] = useState(false);
  const polesRef = useRef([]);
  useEffect(() => {
    polesRef.current = poles;
  }, [poles]);

  const lastEntryRef = useRef(null);
  const lastTrafficEntryRef = useRef(null);

  const processedPoles = useMemo(() => {
    if (isTsOffline) {
      return poles.map(p => ({ ...p, status: "Down" }));
    }
    return poles;
  }, [poles, isTsOffline]);

  const activeFaultCount = processedPoles.filter(p => p.status === "Down").length;

  const triggerSimulation = (statusVal) => {
    const nextEntryId = (lastEntryRef.current || 157) + 1;
    const mockFeed = {
      channel: { id: parseInt(tsChannel) || 3404790, name: 'Simulated Fault Monitoring' },
      feeds: [
        {
          created_at: new Date().toISOString(),
          entry_id: nextEntryId,
          field1: '1',
          field2: statusVal.toString(),
          field3: '100'
        }
      ]
    };
    simulatedFeedRef.current = mockFeed;
    setTriggerPollCount(prev => prev + 1);
  };

  const handleAddPole = async (newPole) => {
    try {
      const poleRef = doc(db, 'streetlights', newPole.id);
      await setDoc(poleRef, {
        id: newPole.id,
        status: 0,
        location: newPole.location,
        area: newPole.area,
        uptime: 100,
        lastUpdate: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
        baseLeft: Math.floor(Math.random() * 55) + 20,
        baseTop: Math.floor(Math.random() * 55) + 20
      });
    } catch (err) {
      console.error("Error adding pole:", err);
    }
  };

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
      setPoles(snapshot.docs.map(doc => {
        const data = doc.data();
        let mappedStatus = data.status;
        if (mappedStatus === 1 || mappedStatus === "1") mappedStatus = "Down";
        else if (mappedStatus === 0 || mappedStatus === "0") mappedStatus = "Up";
        return {
          firebaseId: doc.id,
          ...data,
          status: mappedStatus
        };
      }));
      setHasLoadedSnapshot(true);
    });

    const historyQuery = query(collection(db, 'maintenance_logs'), orderBy('detected_on', 'desc'));
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setHistory(snapshot.docs.map(doc => ({ fault_id: doc.id, ...doc.data() })));
    });

    return () => { unsubscribePoles(); unsubscribeHistory(); };
  }, []);

  // Database Seeding Logic
  useEffect(() => {
    if (!hasLoadedSnapshot) return;
    const seed = async () => {
      for (const p of INITIAL_POLES) {
        if (!poles.some(existing => existing.id === p.id)) {
          await setDoc(doc(db, 'streetlights', p.id), p);
        }
      }
    };
    seed();
  }, [hasLoadedSnapshot, poles]);

  // Dual ThingSpeak Polling Engine (Faults + Traffic)
  useEffect(() => {
    let intervalId;
    const pollThingSpeak = async () => {
      if (!tsChannel || !tsKey) return;
      try {
        // 1. Fetch Fault Data (Use simulated feed if present, otherwise fetch from ThingSpeak)
        let faultData;
        if (simulatedFeedRef.current) {
          faultData = simulatedFeedRef.current;
          simulatedFeedRef.current = null;
        } else {
          const faultRes = await fetch(`https://api.thingspeak.com/channels/${tsChannel}/feeds.json?api_key=${tsKey}&results=10`);
          faultData = await faultRes.json();
        }

        console.log("ThingSpeak Fault Data:", faultData); // Debug log to inspect the structure

        if (faultData.feeds && faultData.feeds.length > 0) {
          // Sync fault readings to NeonDB
          fetch('/api/sync-readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: tsChannel, apiKey: tsKey, type: 'fault', results: 10 })
          })
            .then(() => setLastFetchTime(Date.now()))
            .catch(err => console.error("NeonDB sync error:", err));

          const latestFault = faultData.feeds[faultData.feeds.length - 1];

          // Check if data is stale (no new data within 5 minutes)
          const lastEntryTime = new Date(latestFault.created_at).getTime();
          const now = Date.now();
          const isStale = (now - lastEntryTime) > 5 * 60 * 1000;
          setIsTsOffline(isStale);

          if (isStale) {
            const minAgo = Math.round((now - lastEntryTime) / 60000);
            setSyncStatus(`Telemetry Stale: Last data ${minAgo}m ago. All lights offline.`);
          }

          if (latestFault && latestFault.entry_id !== lastEntryRef.current) {
            lastEntryRef.current = latestFault.entry_id;

            const hardwarePoleId = latestFault.field1;
            const hardwareStatus = latestFault.field2;

            if (hardwarePoleId && hardwareStatus) {
              const formattedPoleId = hardwarePoleId.toString().startsWith('P-') ? hardwarePoleId : `P-${hardwarePoleId}`;
              const currentStatus = hardwareStatus.toString() === "1" ? "Down" : "Up";

              // --- UPDATE 1: The Main Streetlights Collection (Zone 1) ---
              const existingPole = polesRef.current.find(p => p.id === formattedPoleId);
              const poleRef = doc(db, 'streetlights', formattedPoleId);
              await setDoc(poleRef, {
                id: formattedPoleId,
                status: hardwareStatus.toString() === "1" ? 1 : 0,
                location: existingPole?.location || "MG Road",
                area: "Zone 1",
                uptime: currentStatus === "Up" ? 100 : 99.9,
                lastUpdate: new Date(latestFault.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
                baseLeft: existingPole?.baseLeft || 25,
                baseTop: existingPole?.baseTop || 30
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
                    status: 1,
                    timestamp: new Date(latestFault.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                  })
                })
                  .then(res => {
                    if (!res.ok) console.error("Failed to send email alert");
                  })
                  .catch(err => console.error("Error triggering email alert:", err));
              }

              if (!isStale) {
                setSyncStatus(`Updated ${formattedPoleId} to ${currentStatus}`);
              }
            }
          } else {
            if (!isStale) {
              setSyncStatus(`Checked at ${new Date().toLocaleTimeString()} (No changes)`);
            }
          }
        } else {
          setIsTsOffline(true);
          setSyncStatus("No telemetry data found. All lights offline.");
        }

        // 2. Fetch Traffic Data
        const trafficRes = await fetch(`https://api.thingspeak.com/channels/3405925/feeds.json?api_key=HIG3SCTF2JAF0M4X&results=10`);
        const trafficFeed = await trafficRes.json();

        if (trafficFeed.feeds && trafficFeed.feeds.length > 0) {
          // Sync traffic readings to NeonDB
          fetch('/api/sync-readings', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ channelId: '3405925', apiKey: 'HIG3SCTF2JAF0M4X', type: 'traffic', results: 10 })
          })
            .then(() => setLastFetchTime(Date.now()))
            .catch(err => console.error("NeonDB traffic sync error:", err));

          const latestTraffic = trafficFeed.feeds[trafficFeed.feeds.length - 1];

          if (latestTraffic && latestTraffic.entry_id !== lastTrafficEntryRef.current) {
            lastTrafficEntryRef.current = latestTraffic.entry_id;
            setTrafficData({
              count: parseInt(latestTraffic.field1) || 0,
              density: parseInt(latestTraffic.field2) || 1
            });
          }
        }

        // Automatically send fake random telemetry updates for Zone 2 & Zone 3 in Firestore
        const fakePoles = polesRef.current.filter(p => p.area === "Zone 2" || p.area === "Zone 3");
        for (const p of fakePoles) {
          if (Math.random() > 0.75) { // 25% chance to toggle status on each poll
            const newStatusVal = p.status === "Up" ? 1 : 0;
            const deltaUptime = parseFloat(((Math.random() - 0.5) * 2).toFixed(1));
            const newUptime = Math.min(100, Math.max(70, parseFloat(((p.uptime || 95) + deltaUptime).toFixed(1))));

            await setDoc(doc(db, 'streetlights', p.id), {
              status: newStatusVal,
              uptime: newUptime,
              lastUpdate: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            }, { merge: true });

            if (newStatusVal === 1) {
              fetch('/api/send-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  poleId: p.id,
                  status: 1,
                  timestamp: new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                })
              })
                .then(res => {
                  if (!res.ok) console.error("Failed to send email alert");
                })
                .catch(err => console.error("Error triggering email alert:", err));
            }
          }
        }

      } catch (err) {
        console.error("ThingSpeak fetch error:", err);
        setIsTsOffline(true);
        setSyncStatus("API Connection Error. All lights offline.");
      }
    };

    if (isPolling) {
      pollThingSpeak();
    } else {
      setSyncStatus("Stopped");
      setIsTsOffline(false);
    }
  }, [isPolling, tsChannel, tsKey, triggerPollCount]);

  // Telemetry Polling Countdown timer
  useEffect(() => {
    if (!isPolling) {
      setSecondsUntilFetch(20);
      return;
    }

    const timer = setInterval(() => {
      setSecondsUntilFetch(prev => {
        if (prev <= 1) {
          setTriggerPollCount(c => c + 1);
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPolling]);

  const handleTogglePolling = () => {
    const nextVal = !isPolling;
    setIsPolling(nextVal);
    localStorage.setItem('isPolling', nextVal.toString());
  };

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
    return processedPoles.filter(pole => {
      const matchSearch = !filters.search || (pole.id && pole.id.toLowerCase().includes(filters.search.toLowerCase()));
      const matchArea = filters.area === "All Areas" || pole.area === filters.area;
      const matchStreet = filters.street === "All Streets" || pole.location === filters.street;
      const matchStatus = filters.status === "All Status" || pole.status === filters.status;
      return matchSearch && matchArea && matchStreet && matchStatus;
    });
  }, [filters, processedPoles]);

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
    return <EmployeeDashboard user={user} poles={processedPoles} isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} onLogout={() => setUser(null)} />;
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

          <div className="flex items-center gap-3 w-full xl:w-auto justify-end">
            <button onClick={() => setIsModalOpen(true)} className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${isDarkMode ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30' : 'bg-indigo-50 text-indigo-600'}`}>
              <PlusCircle size={14} /> <span className="hidden sm:inline">Add Pole</span>
            </button>

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
        </header>

        {activeView === "Dashboard" && (
          <>
            <StatsOverview poles={processedPoles.filter(p => p.area === "Zone 1")} isDarkMode={isDarkMode} trafficData={trafficData} isTsOffline={isTsOffline} />

            {/* Telemetry Polling Control Panel */}
            <div className={`mb-4 p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${headerTheme}`}>
              <div className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div className={`h-3 w-3 rounded-full ${isPolling ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {isPolling && <div className="absolute h-3 w-3 rounded-full bg-emerald-500 animate-ping opacity-75" />}
                </div>
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>Telemetry Engine</p>
                  <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {isPolling ? `Polling active. Next fetch in ${secondsUntilFetch}s.` : 'Polling suspended.'} {syncStatus && `(${syncStatus})`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleTogglePolling}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm ${
                    isPolling
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-emerald-600 text-white hover:bg-emerald-500'
                  }`}
                >
                  {isPolling ? 'Pause Polling' : 'Start Polling'}
                </button>
                {isPolling && (
                  <button
                    onClick={() => {
                      setTriggerPollCount(c => c + 1);
                      setSecondsUntilFetch(20);
                    }}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                      isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    Fetch Now
                  </button>
                )}
              </div>
            </div>

            <div className={`mb-4 p-3 rounded-xl border flex flex-col lg:flex-row flex-wrap gap-3 items-stretch lg:items-center ${headerTheme}`}>
              <div className="relative flex-1 min-w-full lg:min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Search Pole No..." value={filters.search} onChange={e => updateFilter("search", e.target.value)} className={`w-full pl-9 pr-3 py-2.5 sm:py-2 rounded-lg text-sm sm:text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all ${inputTheme}`} />
              </div>
              <div className="grid grid-cols-2 sm:flex gap-2 sm:gap-3 w-full lg:w-auto">
                <select value={filters.area} onChange={e => updateFilter("area", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Areas</option><option>Zone 1</option><option>Zone 2</option><option>Zone 3</option></select>
                <select value={filters.street} onChange={e => updateFilter("street", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Streets</option><option>Main Road</option><option>MG Road</option><option>Park Street</option><option>Station Road</option></select>
                <select value={filters.status} onChange={e => updateFilter("status", e.target.value)} className={`px-2 py-2.5 sm:py-2 rounded-lg text-xs border focus:outline-none ${inputTheme}`}><option>All Status</option><option>Up</option><option>Down</option></select>
                <button onClick={resetFilters} className={`col-span-2 sm:col-span-1 flex justify-center items-center gap-2 px-3 py-2.5 sm:py-2 rounded-lg text-xs font-medium transition-colors border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'}`}><RotateCcw size={14} /> <span className="sm:hidden">Reset Filters</span></button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4 lg:h-[420px] min-h-0">
              <div className="lg:col-span-2 h-[350px] lg:h-full w-full min-h-0">
                <MapPlaceholder poles={filteredPoles} isDarkMode={isDarkMode} selectedPole={selectedPole} setSelectedPole={setSelectedPole} />
              </div>
              <div className="w-full h-[350px] lg:h-full min-h-0">
                {selectedPole ? (
                  <PoleDetailCard pole={selectedPole} onClose={() => setSelectedPole(null)} isDarkMode={isDarkMode} />
                ) : (
                  <FaultPanel poles={filteredPoles.filter(p => p.area === "Zone 1")} isDarkMode={isDarkMode} />
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
        {activeView === "Alerts" && <AlertsView poles={processedPoles} isDarkMode={isDarkMode} />}
        {activeView === "Analytics & Charts" && <AnalyticsPanel isDarkMode={isDarkMode} poles={processedPoles} />}
        {activeView === "Maintenance Logs" && <HistoryPanel history={history} isDarkMode={isDarkMode} />}
        {activeView === "Settings" && <SettingsView isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />}
        {activeView === "Uptime Report" && <UptimeReport poles={processedPoles} isDarkMode={isDarkMode} />}
        {activeView === "Energy Usage" && <EnergyUsage isDarkMode={isDarkMode} lastFetchTime={lastFetchTime} />}
        {activeView === "Traffic Analytics" && <TrafficAnalytics poles={processedPoles} isDarkMode={isDarkMode} lastFetchTime={lastFetchTime} />}

        <AddPoleModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAdd={handleAddPole} isDarkMode={isDarkMode} />
        <CreateEmployeeModal isOpen={isEmployeeModalOpen} onClose={() => setIsEmployeeModalOpen(false)} isDarkMode={isDarkMode} />
      </main>
    </div>
  );
}