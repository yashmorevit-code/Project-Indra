import { User, Bell, Moon, Sun, Shield, Smartphone, Mail } from 'lucide-react';

export default function SettingsView({ isDarkMode, setIsDarkMode }) {
  const cardBg = isDarkMode ? "bg-[#111827] border-slate-800" : "bg-white border-slate-200 shadow-sm";
  const textPrimary = isDarkMode ? "text-white" : "text-slate-900";
  const textSecondary = isDarkMode ? "text-slate-400" : "text-slate-500";
  const inputBg = isDarkMode ? "bg-[#0A0F1C] border-slate-700 text-white" : "bg-slate-50 border-slate-300 text-slate-900";

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className={`text-2xl font-bold ${textPrimary}`}>System Settings</h2>
        <p className={`text-sm mt-1 ${textSecondary}`}>Manage your account, preferences, and system configurations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className={`md:col-span-2 p-6 rounded-xl border transition-colors ${cardBg}`}>
          <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-500/20">
            <User className="text-indigo-500" />
            <h3 className={`font-semibold ${textPrimary}`}>Profile Information</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <label className={`block mb-1.5 font-medium ${textSecondary}`}>Full Name</label>
              <input type="text" defaultValue="Admin User" className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-indigo-500 ${inputBg}`} />
            </div>
            <div>
              <label className={`block mb-1.5 font-medium ${textSecondary}`}>Email Address</label>
              <input type="email" defaultValue="admin@projectindra.com" className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-indigo-500 ${inputBg}`} />
            </div>
            <div>
              <label className={`block mb-1.5 font-medium ${textSecondary}`}>Role</label>
              <input type="text" defaultValue="Super Admin" disabled className={`w-full p-2.5 rounded-lg border opacity-50 cursor-not-allowed ${inputBg}`} />
            </div>
            <div>
              <label className={`block mb-1.5 font-medium ${textSecondary}`}>Assigned Zone</label>
              <select className={`w-full p-2.5 rounded-lg border focus:outline-none focus:border-indigo-500 ${inputBg}`}>
                <option>All Zones (Global)</option>
                <option>North Zone</option>
                <option>Central Zone</option>
              </select>
            </div>
          </div>
          <button className="mt-6 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors">
            Save Changes
          </button>
        </div>

        {/* Preferences & Appearance */}
        <div className="space-y-6">
          <div className={`p-6 rounded-xl border transition-colors ${cardBg}`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-500/20">
              {isDarkMode ? <Moon className="text-amber-400" /> : <Sun className="text-amber-500" />}
              <h3 className={`font-semibold ${textPrimary}`}>Appearance</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm font-medium ${textPrimary}`}>Dark Mode</p>
                <p className={`text-xs mt-0.5 ${textSecondary}`}>Toggle dark theme.</p>
              </div>
              <button 
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${isDarkMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isDarkMode ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* Notifications */}
          <div className={`p-6 rounded-xl border transition-colors ${cardBg}`}>
            <div className="flex items-center gap-3 mb-6 border-b pb-4 border-slate-500/20">
              <Bell className="text-rose-500" />
              <h3 className={`font-semibold ${textPrimary}`}>Alert Preferences</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail size={16} className={textSecondary} />
                  <span className={`text-sm font-medium ${textPrimary}`}>Email Alerts</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-indigo-600 h-4 w-4" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone size={16} className={textSecondary} />
                  <span className={`text-sm font-medium ${textPrimary}`}>SMS Notifications</span>
                </div>
                <input type="checkbox" defaultChecked className="accent-indigo-600 h-4 w-4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}