import { useState, useEffect, useRef } from 'react';
import { Plus, Minus, Crosshair } from 'lucide-react';

export default function MapPlaceholder({ poles, isDarkMode, selectedPole, setSelectedPole }) {
  const mapRef = useRef(null);
  
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (poles.length === 1) {
      setZoom(1.8);
      setPan({ x: (50 - poles.baseLeft) * 5, y: (50 - poles.baseTop) * 3 });
      setSelectedPole(poles);
    } else if (poles.length > 1) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [poles, setSelectedPole]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.3, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.3, 0.5));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedPole(null); };

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };
  const handleMouseMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setDragStart({ x: e.touches.clientX - pan.x, y: e.touches.clientY - pan.y });
  };
  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setPan({ x: e.touches.clientX - dragStart.x, y: e.touches.clientY - dragStart.y });
  };

  const handleKeyDown = (e) => {
    const step = 20;
    if (e.key === 'ArrowUp') setPan(p => ({ ...p, y: p.y + step }));
    if (e.key === 'ArrowDown') setPan(p => ({ ...p, y: p.y - step }));
    if (e.key === 'ArrowLeft') setPan(p => ({ ...p, x: p.x + step }));
    if (e.key === 'ArrowRight') setPan(p => ({ ...p, x: p.x - step }));
    if (e.key === '+' || e.key === '=') handleZoomIn();
    if (e.key === '-') handleZoomOut();
  };

  const containerBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const mapBg = isDarkMode ? "bg-[#0A0F1C] border-slate-800" : "bg-slate-50 border-slate-300";
  const gridLines = isDarkMode 
    ? "bg-[linear-gradient(to_right,#334155_1px,transparent_1px),linear-gradient(to_bottom,#334155_1px,transparent_1px)]"
    : "bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)]";

  return (
    <div className={`p-3 md:p-5 rounded-xl border h-[300px] sm:h-[350px] lg:h-[420px] flex flex-col relative overflow-hidden transition-colors duration-300 ${containerBg}`}>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 z-10 gap-2">
        <div>
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>Streetlight Map</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Use Arrow Keys or Drag to pan</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-[9px] font-bold uppercase tracking-wider">
          <div className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-600 shadow-[0_0_4px_#f43f5e] animate-pulse" />
            <span className={isDarkMode ? 'text-rose-400' : 'text-rose-600'}>Critical (Z1)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_4px_#f97316]" />
            <span className={isDarkMode ? 'text-orange-400' : 'text-orange-500'}>High (Z2)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_4px_#f59e0b]" />
            <span className={isDarkMode ? 'text-amber-400' : 'text-amber-500'}>Medium (Z3)</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_4px_#10b981]" />
            <span className={isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}>Operational</span>
          </div>
        </div>
      </div>
      
      <div 
        ref={mapRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleMouseUp}
        className={`absolute inset-0 top-20 sm:top-14 rounded-lg m-4 border overflow-hidden cursor-grab active:cursor-grabbing focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${mapBg}`}
      >
        <div 
          className="w-full h-full absolute transition-transform duration-75 ease-out flex items-center justify-center"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
        >
          <div className={`absolute inset-0 opacity-30 ${gridLines} bg-[size:32px_32px] w-[200%] h-[200%] -left-[50%] -top-[50%]`} />
          
          {poles.map((pole) => {
            // Determine pin color, size, and animation based on status and severity/zone
            let pinClass = "h-4 w-4 bg-emerald-500 shadow-[0_0_8px_#10b981]";
            if (pole.status === "Down") {
              if (pole.area === "Zone 2") {
                pinClass = "h-3.5 w-3.5 bg-orange-500 shadow-[0_0_8px_#f97316]";
              } else if (pole.area === "Zone 3") {
                pinClass = "h-3 w-3 bg-amber-500/90 shadow-[0_0_6px_#f59e0b]";
              } else {
                // Zone 1 Critical Faults
                pinClass = "h-5 w-5 bg-rose-600 shadow-[0_0_12px_#f43f5e] ring-2 ring-rose-500/30 animate-pulse";
              }
            }

            return (
              <div 
                key={pole.id} 
                className="absolute transition-transform hover:scale-110 cursor-pointer flex flex-col items-center z-20"
                style={{ left: `${pole.baseLeft}%`, top: `${pole.baseTop}%` }}
                onClick={(e) => {
                  e.stopPropagation(); 
                  setSelectedPole(selectedPole?.id === pole.id ? null : pole);
                }}
              >
                <div className={`rounded-full border-2 ${isDarkMode ? 'border-[#0A0F1C]' : 'border-white'} ${pinClass} ${selectedPole?.id === pole.id ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}></div>
                <span className={`text-[9px] mt-1 font-mono font-bold ${isDarkMode ? 'text-slate-400' : 'text-slate-600'}`}>{pole.id}</span>
              </div>
            );
          })}
        </div>

        <div className="absolute right-4 bottom-4 flex flex-col gap-2 z-30">
            <button onClick={handleZoomIn} className={`p-1.5 rounded-md border shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}><Plus size={14}/></button>
            <button onClick={handleZoomOut} className={`p-1.5 rounded-md border shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}><Minus size={14}/></button>
            <button onClick={handleReset} className={`p-1.5 rounded-md border shadow-sm ${isDarkMode ? 'bg-[#1e293b] border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-100'}`}><Crosshair size={14}/></button>
        </div>
      </div>
    </div>
  );
}