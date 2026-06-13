import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';

const generateInitialData = (poles) => {
  const data = [];
  const now = new Date();
  const upCount = poles.filter(p => p.status !== 'Down').length;
  const baseUptime = poles.length > 0 ? (upCount / poles.length) * 100 : 100;
  const baseEnergy = upCount * 5; 

  // Nominal baselines for historical pre-data (avoids flattening to 0)
  const nominalUptime = baseUptime > 0 ? baseUptime : 97.5;
  const nominalEnergy = baseEnergy > 0 ? baseEnergy : 35;

  for (let i = 60; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3000);
    // Add realistic fluctuations for history, then converge to the real live value at i = 0
    const uptimeFluctuation = Math.max(85, Math.min(100, nominalUptime + (Math.sin(i / 6) * 3) + ((Math.random() - 0.5) * 1.2)));
    const energyFluctuation = Math.max(15, nominalEnergy + (Math.cos(i / 5) * 4) + ((Math.random() - 0.5) * 2));

    data.push({
      time: t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      uptime: parseFloat((i === 0 ? baseUptime : uptimeFluctuation).toFixed(1)),
      energy: parseFloat((i === 0 ? baseEnergy : energyFluctuation).toFixed(1))
    });
  }
  return data;
};

export function UptimeChart({ isDarkMode, poles = [] }) {
  const [data, setData] = useState([]);
  const polesRef = useRef(poles);

  useEffect(() => {
    polesRef.current = poles;
  }, [poles]);

  useEffect(() => {
    setData(generateInitialData(polesRef.current));

    const interval = setInterval(() => {
      setData(prev => {
        const currentPoles = polesRef.current;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const upCount = currentPoles.filter(p => p.status !== 'Down').length;
        const uptimeVal = currentPoles.length > 0 ? (upCount / currentPoles.length) * 100 : 100;

        const newData = [...prev, { time: timeStr, uptime: parseFloat(uptimeVal.toFixed(1)) }];
        if (newData.length > 60) newData.shift();
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';

  return (
    <div className={`p-4 rounded-xl border w-full h-full transition-colors flex flex-col min-h-0 overflow-hidden ${cardBg}`}>
      <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>System Uptime Trend (%)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={textColor} tickLine={false} axisLine={false} minTickGap={25} style={{ fontSize: '9px' }} />
            <YAxis stroke={textColor} tickLine={false} axisLine={false} domain={[0, 100]} style={{ fontSize: '9px' }} />
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
            <Line type="stepAfter" dataKey="uptime" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#3b82f6', stroke: isDarkMode ? '#0f172a' : '#fff' }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function EnergyChart({ isDarkMode, poles = [] }) {
  const [data, setData] = useState([]);
  const polesRef = useRef(poles);

  useEffect(() => {
    polesRef.current = poles;
  }, [poles]);

  useEffect(() => {
    setData(generateInitialData(polesRef.current));

    const interval = setInterval(() => {
      setData(prev => {
        const currentPoles = polesRef.current;
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        
        const upCount = currentPoles.filter(p => p.status !== 'Down').length;
        const energyVal = upCount * 5;

        const newData = [...prev, { time: timeStr, energy: energyVal }];
        if (newData.length > 60) newData.shift();
        return newData;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const gridColor = isDarkMode ? "#1e293b" : "#e2e8f0";
  const textColor = isDarkMode ? "#64748b" : "#94a3b8";
  const tooltipBg = isDarkMode ? '#1e293b' : '#fff';

  return (
    <div className={`p-4 rounded-xl border w-full h-full transition-colors flex flex-col min-h-0 overflow-hidden ${cardBg}`}>
      <h3 className={`text-[10px] font-semibold uppercase tracking-wider mb-2 shrink-0 ${isDarkMode ? 'text-slate-300' : 'text-slate-800'}`}>Live Energy Draw (Watts)</h3>
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <LineChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis dataKey="time" stroke={textColor} tickLine={false} axisLine={false} minTickGap={25} style={{ fontSize: '9px' }} />
            <YAxis stroke={textColor} tickLine={false} axisLine={false} domain={[0, 50]} style={{ fontSize: '9px' }} />
            <Tooltip contentStyle={{ background: tooltipBg, border: `1px solid ${gridColor}`, borderRadius: '8px', color: isDarkMode ? '#fff' : '#000' }} />
            <Line type="stepAfter" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: '#10b981', stroke: isDarkMode ? '#0f172a' : '#fff' }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}