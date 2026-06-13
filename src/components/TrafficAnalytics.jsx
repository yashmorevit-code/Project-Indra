import { useState, useEffect } from 'react';
import { Car, Clock, TrendingUp, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

export default function TrafficAnalytics({ poles = [], isDarkMode, lastFetchTime }) {
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchTrafficMetrics = async () => {
    if (!data) {
      setLoading(true);
    } else {
      setIsUpdating(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/traffic-analytics');
      if (!res.ok) throw new Error("Failed to load traffic metrics");
      const result = await res.json();
      if (result.success) {
        setData(result);
      } else {
        throw new Error(result.error || "Unknown error occurred");
      }
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  };

  useEffect(() => {
    fetchTrafficMetrics();
  }, [lastFetchTime]);

  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700/50' : 'bg-slate-50 border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
          <p className={`text-xs font-semibold ${textSecondary}`}>Loading traffic analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-6 rounded-xl border text-center ${bgTheme}`}>
        <AlertCircle className="mx-auto text-rose-500 mb-3" size={32} />
        <h3 className={`text-sm font-bold mb-2 ${textPrimary}`}>Failed to load Traffic Analytics</h3>
        <p className={`text-xs mb-4 ${textSecondary}`}>{error}</p>
        <button
          onClick={fetchTrafficMetrics}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { summary = [], chartData = [] } = data || {};

  // Compute active faults per zone from the live Firestore poles state
  const zoneFaults = { 'Zone 1': 0, 'Zone 2': 0, 'Zone 3': 0 };
  poles.forEach(p => {
    if (p.status === 'Down' || p.status === 1 || p.status === '1') {
      const z = p.area || 'Zone 1';
      zoneFaults[z] = (zoneFaults[z] || 0) + 1;
    }
  });

  // Calculate Maintenance Priority Recommendations
  const priorityRecommendations = summary.map(item => {
    const faultsCount = zoneFaults[item.zone] || 0;
    const avgDensity = item.avgDensity || 0;
    
    // Priority Score: Faults are highly weighted (15pts each), and traffic density scales it (3pts per unit)
    const score = (faultsCount * 15) + (avgDensity * 3);
    
    let level = 'Healthy';
    let color = 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    let text = 'No Action Required';
    
    if (faultsCount > 0) {
      if (avgDensity >= 6) {
        level = 'Critical';
        color = 'bg-rose-500/10 text-rose-500 border-rose-500/20 animate-pulse font-extrabold';
        text = 'Immediate action required: High traffic zone with faults!';
      } else if (avgDensity >= 3.5) {
        level = 'High';
        color = 'bg-orange-500/10 text-orange-500 border-orange-500/20 font-bold';
        text = 'Schedule maintenance soon: Medium traffic zone with faults.';
      } else {
        level = 'Medium';
        color = 'bg-amber-500/10 text-amber-500 border-amber-500/20 font-semibold';
        text = 'Routine fault repair: Low traffic zone.';
      }
    } else if (avgDensity >= 7) {
      level = 'Low';
      color = 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      text = 'Monitoring: High traffic volume, all lights functional.';
    }

    return {
      zone: item.zone,
      faultsCount,
      avgDensity,
      score,
      level,
      color,
      text
    };
  }).sort((a, b) => b.score - a.score);

  // Color mappings for each zone card
  const zoneColors = {
    'Zone 1': { border: 'border-indigo-500/20', text: 'text-indigo-500', bg: 'bg-indigo-500/10', glow: 'shadow-[0_0_15px_rgba(99,102,241,0.1)]', chart: '#6366f1' },
    'Zone 2': { border: 'border-emerald-500/20', text: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: 'shadow-[0_0_15px_rgba(16,185,129,0.1)]', chart: '#10b981' },
    'Zone 3': { border: 'border-amber-500/20', text: 'text-amber-500', bg: 'bg-amber-500/10', glow: 'shadow-[0_0_15px_rgba(245,158,11,0.1)]', chart: '#f59e0b' }
  };

  return (
    <div className={`max-w-5xl mx-auto p-6 rounded-xl border ${bgTheme} transition-colors duration-300 space-y-6`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b pb-6 border-slate-500/20 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
            <Car className="text-indigo-500 animate-pulse" size={22} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>Traffic Intensity Analytics</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>Dynamic vehicle count and density trends mapped from NeonDB telemetry records.</p>
          </div>
        </div>
        <button onClick={fetchTrafficMetrics} className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
          <RefreshCw size={16} className={isUpdating ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {/* Zonal Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {summary.map(item => {
          const cfg = zoneColors[item.zone] || zoneColors['Zone 1'];
          return (
            <div key={item.zone} className={`p-5 rounded-xl border ${cardBg} ${cfg.border} ${cfg.glow} flex flex-col justify-between`}>
              <div className="flex items-center justify-between mb-4">
                <span className={`text-xs font-bold uppercase tracking-wider ${textSecondary}`}>{item.zone}</span>
                <span className={`p-1.5 rounded-lg ${cfg.bg} ${cfg.text}`}>
                  <Car size={16} />
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <p className={`text-[10px] uppercase font-bold tracking-wider ${textSecondary}`}>Average Density</p>
                  <div className="flex items-baseline gap-2 mt-1">
                    <p className={`text-2xl font-black ${textPrimary}`}>{item.avgDensity}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">/ 10.0</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-500/10">
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Total Vehicles</p>
                    <p className={`text-sm font-extrabold ${textPrimary}`}>{item.totalVehicles.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-[9px] uppercase font-bold tracking-wider text-slate-500">Peak Period</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Clock size={11} className="text-indigo-500" />
                      <p className={`text-xs font-extrabold ${textPrimary}`}>{item.peakHour}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Traffic Trend Line Chart */}
      <div className={`p-5 rounded-xl border ${cardBg}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-indigo-500" size={18} />
            <h3 className={`text-sm font-bold ${textPrimary}`}>Traffic Flow Trajectory (7-Day trailing)</h3>
          </div>
        </div>

        <div className="h-[320px] w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#1f2937" : "#e5e7eb"} vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  domain={[1, 10]}
                  stroke={isDarkMode ? "#94a3b8" : "#64748b"} 
                  fontSize={9}
                  tickLine={false}
                  axisLine={false}
                  tickCount={5}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: isDarkMode ? '#0a0f1c' : '#ffffff', 
                    borderColor: isDarkMode ? '#334155' : '#cbd5e1',
                    borderRadius: '8px',
                    color: isDarkMode ? '#f8fafc' : '#0f172a',
                    fontSize: '11px'
                  }} 
                />
                <Legend 
                  verticalAlign="top" 
                  height={36} 
                  iconType="circle"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', fontWeight: '600' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Zone 1" 
                  stroke={zoneColors['Zone 1'].chart} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Zone 2" 
                  stroke={zoneColors['Zone 2'].chart} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="Zone 3" 
                  stroke={zoneColors['Zone 3'].chart} 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className={`text-xs ${textSecondary}`}>No historical trend readings recorded yet.</p>
            </div>
          )}
        </div>
      </div>

      {/* Maintenance Priority Analysis */}
      <div className={`p-5 rounded-xl border ${cardBg}`}>
        <div className="flex items-center gap-2 mb-3">
          <ShieldAlert className="text-indigo-500" size={18} />
          <h3 className={`text-sm font-bold ${textPrimary}`}>Maintenance Priority Recommendation</h3>
        </div>
        <p className={`text-xs mb-6 ${textSecondary}`}>
          Ranks repairing requirements per zone by correlating active streetlight faults with historical traffic density. Zones with faults and higher density receive higher priority scores to guarantee motorist and pedestrian safety.
        </p>

        <div className="space-y-4">
          {priorityRecommendations.map(rec => (
            <div 
              key={rec.zone} 
              className={`p-4 rounded-xl border ${
                isDarkMode ? 'bg-[#111827]/30 border-slate-800' : 'bg-white border-slate-200'
              } flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3`}
            >
              <div>
                <h4 className={`text-sm font-bold ${textPrimary}`}>{rec.zone}</h4>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-[11px]">
                  <span className={`${textSecondary}`}>
                    Active Faults: <strong className={rec.faultsCount > 0 ? 'text-rose-500' : 'text-emerald-500'}>{rec.faultsCount}</strong>
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={`${textSecondary}`}>
                    Avg Traffic Density: <strong className={textPrimary}>{rec.avgDensity}</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 self-stretch sm:self-auto justify-between sm:justify-end">
                <span className={`text-[10px] px-2.5 py-1 rounded-full border font-bold uppercase tracking-wider ${rec.color}`}>
                  {rec.level} Priority
                </span>
                <span className={`text-xs font-semibold ${textSecondary}`}>
                  {rec.text}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
