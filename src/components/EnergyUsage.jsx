import { Zap, TrendingDown, Leaf } from 'lucide-react';

export default function EnergyUsage({ poles = [], isDarkMode }) {
  const bgTheme = isDarkMode ? 'bg-[#111827] border-slate-800' : 'bg-white border-slate-200 shadow-sm';
  const cardBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700/50' : 'bg-slate-50 border-slate-200';
  const textPrimary = isDarkMode ? 'text-white' : 'text-slate-900';
  const textSecondary = isDarkMode ? 'text-slate-400' : 'text-slate-500';

  // Constants for our calculation engine
  const WATTAGE_PER_POLE_KW = 0.15; // 150 Watts
  const COST_PER_KWH = 7.5; // Example: ₹7.5 per kWh

  // Process raw data into actionable metrics per zone
  const derivedEnergyData = {};
  
  poles.forEach(pole => {
    // In reality, uptime would be calculated dynamically. For the UI, we'll use the tracked uptime percentage 
    // against an assumed 360 hours (30 days * 12 hours/night)
    const assumedMonthlyHours = 360;
    const actualUptimeHours = assumedMonthlyHours * (pole.uptime / 100);
    const downtimeHours = assumedMonthlyHours - actualUptimeHours;
    
    const consumedKwh = actualUptimeHours * WATTAGE_PER_POLE_KW;
    const cost = consumedKwh * COST_PER_KWH;
    
    // "Saved" energy here represents energy not used during downtime
    const savedKwh = downtimeHours * WATTAGE_PER_POLE_KW;

    if (!derivedEnergyData[pole.area]) {
      derivedEnergyData[pole.area] = { kwh: 0, cost: 0, saved: 0 };
    }
    
    derivedEnergyData[pole.area].kwh += consumedKwh;
    derivedEnergyData[pole.area].cost += cost;
    derivedEnergyData[pole.area].saved += savedKwh;
  });

  const zoneList = Object.keys(derivedEnergyData).map(zone => ({
    zone,
    ...derivedEnergyData[zone]
  }));

  const totalKwh = zoneList.reduce((acc, curr) => acc + curr.kwh, 0);
  const totalCost = zoneList.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <div className={`max-w-5xl mx-auto p-6 rounded-xl border ${bgTheme}`}>
       <div className="flex items-center justify-between mb-8 border-b pb-4 border-slate-500/20">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
            <Zap className="text-amber-500" size={20} />
          </div>
          <div>
            <h2 className={`text-xl font-bold ${textPrimary}`}>Derived Energy Metrics</h2>
            <p className={`text-xs mt-1 ${textSecondary}`}>Calculated via (Uptime Hours × 0.15kW rating).</p>
          </div>
        </div>
        <div className="text-right hidden sm:block">
           <p className={`text-2xl font-bold ${textPrimary}`}>{totalKwh.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-normal opacity-60">kWh</span></p>
           <p className="text-emerald-500 font-bold text-sm">₹{totalCost.toLocaleString(undefined, {maximumFractionDigits: 0})} Est. Cost</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {zoneList.map(data => (
          <div key={data.zone} className={`p-5 rounded-xl border relative overflow-hidden ${cardBg}`}>
            <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
              <Zap size={64} />
            </div>
            <p className={`text-xs font-bold uppercase tracking-wider mb-4 ${textSecondary}`}>{data.zone}</p>
            <div className="flex justify-between items-end">
              <div>
                <p className={`text-3xl font-bold ${textPrimary}`}>{data.kwh.toLocaleString(undefined, {maximumFractionDigits: 0})} <span className="text-sm font-medium opacity-50">kWh</span></p>
                <div className={`flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-500`}>
                  <Leaf size={14} />
                  {data.saved.toLocaleString(undefined, {maximumFractionDigits: 1})} kWh unutilized
                </div>
              </div>
              <div className="text-right">
                <p className={`text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>₹{data.cost.toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
                <p className={`text-[10px] uppercase tracking-wider mt-1 ${textSecondary}`}>Est. Cost</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}