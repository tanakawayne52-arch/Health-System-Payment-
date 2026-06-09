import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Lock, Users2, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message || 'Invalid credentials. Please try again.');
      }
    } catch (err) {
      console.error('Login submit error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Hero Section */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f172a] text-white p-12 flex-col justify-between overflow-hidden">
        {/* Flag Stripe */}
        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b from-[#006400] via-[#FFD700] to-[#D40000]" aria-hidden />
        
        {/* Blurred accent circles */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#0d9488]/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#dc2626]/10 blur-3xl" aria-hidden />

        {/* Top Logo Section */}
        <div className="relative">
          <div className="flex items-center gap-6">
            <div className="h-28 w-28 rounded-2xl bg-white p-3 ring-1 ring-white/20 shadow-xl">
              <img
                src="/MOHCC Designed logo.png"
                alt="MoHCC"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="text-xl uppercase tracking-[0.2em] text-white/60">Republic of Zimbabwe</div>
              <div className="text-3xl font-bold">Ministry of Health & Child Care</div>
            </div>
          </div>
        </div>

        {/* Center Content */}
        <div className="relative max-w-md">
          <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-wider text-[#0d9488]/90 mb-4 px-2.5 py-1 rounded-full bg-white/5 ring-1 ring-white/10">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0d9488] animate-pulse" /> FEPMS v1.0 · Live
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Front-End Payment <br /> Management System
          </h1>
          <p className="mt-4 text-white/75 leading-relaxed">
            Strengthen internal controls, eliminate payment duplications, and prepare for secure
            EcoCash integration — across all ten provinces.
          </p>
          <div className="mt-8 flex items-center gap-2 text-sm text-white/70">
            <ShieldCheck className="h-4 w-4 text-[#0d9488]" />
            Role-based · audit-ready · decentralised
          </div>
        </div>

        {/* Footer */}
        <div className="relative text-xs text-white/50">© {new Date().getFullYear()} MoHCC · FEPMS v1.0</div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-to-br from-gray-100 to-gray-200">
        <div className="w-full max-w-md bg-white rounded-lg shadow-xl p-0 overflow-hidden">
          {/* Multicolor flag stripe */}
          <div className="h-3 w-full bg-gradient-to-r from-[#006400] via-[#FFD700] to-[#D40000] rounded-t-lg" style={{background: 'linear-gradient(90deg, #006400 0%, #FFD700 20%, #D40000 40%, #000000 60%, #D40000 75%, #FFD700 90%, #006400 100%)'}} />
          <div className="p-8 border-t border-white/5">
          {/* Mobile Logo */}
          <div className="flex flex-col items-center text-center gap-4 mb-8 lg:hidden">
            <img
              src="/MOHCC Designed logo.png"
              alt="MoHCC"
              className="h-24 w-24 rounded-xl object-contain shadow-lg ring-1 ring-gray-100"
            />
            <div className="text-2xl font-bold tracking-tight text-gray-900">FEPMS</div>
          </div>
          
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="text-sm text-gray-500 mt-1">Enter your MoHCC credentials to continue.</p>

          <form onSubmit={handleSubmit} className="space-y-4 mt-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                <button type="button" className="text-xs text-[#0d9488] hover:underline">Forgot?</button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-base text-gray-900 placeholder:text-gray-400 focus:border-[#0d9488] focus:outline-none focus:ring-2 focus:ring-[#0d9488]/30 transition-all"
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0d9488] text-white font-semibold text-base rounded-lg py-3 hover:bg-[#0f766e] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Lock className="h-4 w-4" />
              {loading ? "Signing in…" : "Sign in"}
            </button>
            
            <p className="text-[11px] text-gray-500 text-center">
              Authorised personnel only. All actions are logged.
            </p>
          </form>
          </div>
        </div>
      </div>
    </div>
  );
}
