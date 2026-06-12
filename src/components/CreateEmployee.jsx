import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { X, UserPlus } from 'lucide-react';

export default function CreateEmployeeModal({ isOpen, onClose, isDarkMode }) {
  const [formData, setFormData] = useState({ username: '', password: '', displayRole: 'Field Employee' });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      console.log("Attempting to write to Firestore: ", formData.username);
      // Writes to the 'users' collection in Firestore
      await setDoc(doc(db, 'users', formData.username), {
        username: formData.username,
        password: formData.password,
        displayRole: formData.displayRole,
        role: 'employee'
      });
      alert("Employee account created successfully!");
      setFormData({ username: '', password: '', displayRole: 'Field Employee' });
      onClose();
    } catch (err) {
      console.error("Firestore Write Error: ", err);
      alert("Error: " + err.message); // This will tell you if it's a permissions issue!
    }
    setLoading(false);
  };

  const modalBg = isDarkMode ? 'bg-[#111827] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800';
  const inputBg = isDarkMode ? 'bg-[#0A0F1C] border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-900';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-md p-6 rounded-xl border shadow-2xl relative ${modalBg}`}>
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-500 hover:text-slate-400"><X size={18} /></button>
        <div className="flex items-center gap-2 mb-4">
          <UserPlus className="text-indigo-500" size={20} />
          <h3 className="text-sm font-bold uppercase tracking-wider">Issue Employee Access</h3>
        </div>
        
        <form onSubmit={handleCreate} className="space-y-4 text-xs">
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Employee Username</label>
            <input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputBg}`} />
          </div>
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Temporary Password</label>
            <input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputBg}`} />
          </div>
          <div>
            <label className="block mb-1.5 font-medium opacity-80">Title / Designation</label>
            <input required type="text" value={formData.displayRole} onChange={e => setFormData({...formData, displayRole: e.target.value})} className={`w-full p-2.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-indigo-500 ${inputBg}`} />
          </div>

          <div className="flex justify-end pt-3">
            <button type="submit" disabled={loading} className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-md">
              {loading ? 'Processing...' : 'Create Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}