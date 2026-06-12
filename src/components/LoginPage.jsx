import { useState } from 'react';
import { Eye, EyeOff, Zap } from 'lucide-react';

const ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'admin123'
};

const EMPLOYEE_CREDENTIALS = {
  username: 'employee',
  password: 'employee123'
};

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        onLogin({ username, role: 'admin', displayRole: 'Super Admin' });
      } else if (username === EMPLOYEE_CREDENTIALS.username && password === EMPLOYEE_CREDENTIALS.password) {
        onLogin({ username, role: 'employee', displayRole: 'Field Employee' });
      } else {
        setError('Invalid username or password.');
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 bg-indigo-600 rounded-2xl shadow-[0_0_30px_rgba(99,102,241,0.5)] mb-5">
            <Zap size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Project Indra</h1>
          <p className="text-slate-400 text-sm mt-1">Smart Streetlight Management System</p>
        </div>

        {/* Card */}
        <div className="bg-[#111827] border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white">Sign In</h2>
            <p className="text-slate-400 text-xs mt-1">Enter your credentials to access the dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full px-4 py-3 bg-[#0A0F1C] border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-4 py-3 bg-[#0A0F1C] border border-slate-700 rounded-xl text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all pr-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg px-4 py-2.5 text-xs text-rose-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-all duration-200 shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)] mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-600 text-center">
              Demo: <span className="text-slate-500 font-mono">admin</span> / <span className="text-slate-500 font-mono">admin123</span>
              <span className="mx-2 text-slate-700">|</span>
              <span className="text-slate-500 font-mono">employee</span> / <span className="text-slate-500 font-mono">employee123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
