import { useState, useEffect } from 'react';
import { Zap, TrendingDown, Leaf, RefreshCw } from 'lucide-react';

export default function EnergyUsage({ isDarkMode, lastFetchTime }) {
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [error, setError] = useState(null);

  const fetchMetrics = async () => {
    if (!analyticsData) {
      setLoading(true);
    } else {
      setIsUpdating(true);
    }
    setError(null);
    try {
      const res = await fetch('/api/energy-analytics');
      if (!res.ok) throw new Error("Failed to load energy metrics");
      const result = await res.json();
      if (result.success) {
        setAnalyticsData(result);
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
    fetchMetrics();
  }, [lastFetchTime]);

  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700/50' : 'bg-slate-50 border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  if (loading) {
    return (
      <div className={`max-w-5xl mx-auto p-12 rounded-xl border flex flex-col items-center justify-center min-h-[300px] ${bgTheme}`}>
        <RefreshCw className="animate-spin text-indigo-500 mb-3" size={32} />
        <p className={`text-sm ${textSecondary}`}>Fetching 30-day historical data from database...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`max-w-5xl mx-auto p-12 rounded-xl border flex flex-col items-center justify-center min-h-[300px] ${bgTheme}`}>
        <div className="bg-rose-500/10 p-3 rounded-full border border-rose-500/20 mb-3">
          <Zap className="text-rose-500" size={24} />
        </div>
        <p className="text-sm text-rose-500 font-semibold mb-2">Error: {error}</p>
        <button onClick={fetchMetrics} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-colors">
          Retry Connection
        </button>
      </div>
    );
  }

  const { data: zones = [], dimmingFactor = 1.0 } = analyticsData || {};
  
  const totalBaselineKwh = zones.reduce((acc, curr) => acc + curr.baselineKwh, 0);
  const totalConsumedKwh = zones.reduce((acc, curr) => acc + curr.consumedKwh, 0);
  const totalSavedKwh = zones.reduce((acc, curr) => acc + curr.savedKwh, 0);
  
  const totalBaselineCost = totalBaselineKwh * 7.5;
  const totalActualCost = totalConsumedKwh * 7.5;
  const totalSavedCost = totalSavedKwh * 7.5;
  
  const averageSavedPercentage = totalBaselineKwh > 0 ? ((totalSavedKwh / totalBaselineKwh) * 100).toFixed(1) : 0;

  return (
    <div className={`max-w-5xl mx-auto p-6 rounded-xl border ${bgTheme} transition-colors duration-300`}>
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b pb-6 border-slate-500/20 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20">
            <Zap className="text-indigo-500 animate-pulse" size={22} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>IoT Energy Optimization</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>30-day historical analysis comparing IoT smart control against traditional operations.</p>
          </div>
        </div>
        <button onClick={fetchMetrics} className={`p-2 rounded-lg border transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
          <RefreshCw size={16} className={isUpdating ? "animate-spin text-indigo-500" : ""} />
        </button>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        <div className={`p-5 rounded-xl border ${cardBg}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>Traditional Consumption (No IoT)</p>
          <h3 className={`text-3xl font-extrabold mt-2 ${textPrimary}`}>{totalBaselineKwh.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-medium opacity-50">kWh</span></h3>
          <p className="text-rose-500 text-xs font-semibold mt-2">₹{totalBaselineCost.toLocaleString(undefined, {maximumFractionDigits: 0})} (12h/night continuous)</p>
        </div>
        <div className={`p-5 rounded-xl border ${cardBg}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${textSecondary}`}>IoT-Optimized Consumption</p>
          <h3 className={`text-3xl font-extrabold mt-2 ${textPrimary}`}>{totalConsumedKwh.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-medium opacity-50">kWh</span></h3>
          <p className="text-indigo-500 text-xs font-semibold mt-2">₹{totalActualCost.toLocaleString(undefined, {maximumFractionDigits: 0})} (Active uptime & dimming)</p>
        </div>
        <div className={`p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5`}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Total Energy Saved (Conserved)</p>
          <h3 className="text-3xl font-extrabold mt-2 text-emerald-500">{totalSavedKwh.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-medium opacity-70">kWh</span></h3>
          <p className="text-emerald-500 text-xs font-semibold mt-2 flex items-center gap-1">
            <TrendingDown size={14} /> ₹{totalSavedCost.toLocaleString(undefined, {maximumFractionDigits: 0})} Saved ({averageSavedPercentage}% reduction)
          </p>
        </div>
      </div>

      {/* Zonal Breakdown & Visual Progress */}
      <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${textSecondary}`}>Conserved Energy per Zone</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {zones.map(data => {
          // Calculate relative percentage height/width for charts
          const iotPct = (data.consumedKwh / data.baselineKwh) * 100;
          return (
            <div key={data.zone} className={`p-5 rounded-xl border relative overflow-hidden ${cardBg}`}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className={`text-sm font-bold ${textPrimary}`}>{data.zone}</p>
                  <p className={`text-[10px] mt-0.5 ${textSecondary}`}>{data.poleCount} poles monitored</p>
                </div>
                <div className="bg-emerald-500/10 text-emerald-500 text-xs font-bold px-2 py-0.5 rounded-full border border-emerald-500/15">
                  -{data.savedPercentage}%
                </div>
              </div>

              {/* Stacked comparison bar */}
              <div className="space-y-3 mt-2">
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className={textSecondary}>Traditional Schedule (12h straight)</span>
                    <span className={`font-semibold ${textPrimary}`}>{data.baselineKwh} kWh</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-rose-500 h-full rounded-full w-full"></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className={textSecondary}>IoT-Controlled (Uptime + Dimming)</span>
                    <span className={`font-semibold text-indigo-400`}>{data.consumedKwh} kWh</span>
                  </div>
                  <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${iotPct}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-end border-t border-slate-500/10 pt-4 mt-4 text-xs">
                <div>
                  <p className={`text-[10px] uppercase tracking-wider ${textSecondary}`}>Est. Cost Saved</p>
                  <p className="text-emerald-500 font-bold text-sm mt-0.5">₹{data.savedCost.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[10px] uppercase tracking-wider ${textSecondary}`}>Energy Saved</p>
                  <p className={`font-bold mt-0.5 flex items-center gap-0.5 justify-end text-emerald-400`}>
                    <Leaf size={12} className="text-emerald-500" /> {data.savedKwh} kWh
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Energy Formula & Calculation Guide Card */}
      <div className={`p-5 rounded-xl border border-indigo-500/10 bg-indigo-500/5`}>
        <h4 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-1.5">
          <Leaf size={16} /> How is Energy Conservation Calculated?
        </h4>
        <div className={`text-xs space-y-2 leading-relaxed ${textSecondary}`}>
          <p>
            <strong>Baseline Calculation (Without IoT):</strong> A standard night light uses continuous power during designated hours. 
            For example, running a small 0.5 W night light for 24 hours a day uses just 0.36 kWh a month: 
            <code className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono text-[10px] ml-1">
              0.5 W &times; 24 hours &times; 30 days = 360 Wh = 0.36 kWh
            </code>.
          </p>
          <p>
            For streetlights, we apply the exact same formula to calculate traditional continuous night schedules (12 hours straight):
            <code className="block mt-1 p-2 rounded bg-slate-800/80 text-indigo-300 font-mono text-[10px] whitespace-pre-wrap">
              Traditional: 150 W pole rating &times; 12 hours &times; 30 days = 54,000 Wh = 54 kWh per pole
            </code>
          </p>
          <p>
            <strong>IoT Optimization:</strong> The smart controller dynamically optimizes this power profile:
          </p>
          <ul className="list-disc pl-4 space-y-1">
            <li><strong>Uptime Tracking:</strong> Integrates active status metrics to only consume power when nodes are operational.</li>
            <li><strong>Dynamic Traffic Dimming:</strong> Regulates streetlight brightness based on real-time traffic levels. Current 30-day average traffic factor is <strong className="text-indigo-400">{(dimmingFactor * 100).toFixed(0)}%</strong> of full rated power.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}