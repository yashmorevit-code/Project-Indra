import { useState } from 'react';
import { X } from 'lucide-react';

export default function AddPoleModal({ isOpen, onClose, onAdd, isDarkMode }) {
  const [id, setId] = useState('');
  const [location, setLocation] = useState('');
  const [area, setArea] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!id || !location || !area) {
      alert("Please fill in all fields.");
      return;
    }
    onAdd({ id, location, area });
    // Reset form states
    setId('');
    setLocation('');
    setArea('');
    onClose();
  };

  const modalBg = isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700 text-slate-200 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-indigo-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className={`w-full max-w-md p-6 rounded-xl border shadow-2xl relative transition-all ${modalBg}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-400">
          <X size={18} />
        </button>

        <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Add New Cluster Node</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Pole Identifier</label>
            <input 
              type="text" required placeholder="e.g., P-105" value={id}
              onChange={e => setId(e.target.value)}
              className={`w-full p-2.5 rounded-lg border focus:outline-none text-xs transition-all ${inputBg}`}
            />
          </div>
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Street / Road Name</label>
            <input 
              type="text" required placeholder="e.g., Park Street" value={location}
              onChange={e => setLocation(e.target.value)}
              className={`w-full p-2.5 rounded-lg border focus:outline-none text-xs transition-all ${inputBg}`}
            />
          </div>
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Operational District Zone</label>
            <select 
              required value={area} onChange={e => setArea(e.target.value)}
              className={`w-full p-2.5 rounded-lg border focus:outline-none text-xs transition-all ${inputBg}`}
            >
              <option value="">Select Zone...</option>
              <option value="Zone 1">Zone 1</option>
              <option value="Zone 2">Zone 2</option>
              <option value="Zone 3">Zone 3</option>
            </select>
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <button 
              type="button" onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'}`}
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors"
            >
              Save to Cluster
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}