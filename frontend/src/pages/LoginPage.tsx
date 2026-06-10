import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ShieldCheck, Lock, Mail, Eye, EyeOff } from 'lucide-react';


export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

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
    <div className="min-h-screen flex relative">
      {/* Left Hero Section */}
      <div className="hidden lg:flex flex-1 relative bg-[#0f172a] text-white p-12 flex-col justify-center items-center overflow-hidden">
        {/* Flag Stripe (Left) */}
        <div className="absolute inset-y-0 left-0 w-2.5 bg-gradient-to-b from-[#006400] via-[#FFD700] to-[#D40000]" aria-hidden />
        
        {/* Blurred accent circles */}
        <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#0d9488]/10 blur-3xl" aria-hidden />
        <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-[#dc2626]/10 blur-3xl" aria-hidden />

        {/* Center Logo Section */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="h-64 w-64 rounded-full bg-white p-6 ring-4 ring-[#FFD700]/50 shadow-[0_0_50px_rgba(255,215,0,0.2)] flex items-center justify-center">
            <img
              src="/MOHCC Designed logo.png"
              alt="MoHCC"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="mt-12 text-center max-w-md">
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
            <div className="mt-8 flex items-center justify-center gap-2 text-sm text-white/70">
              <ShieldCheck className="h-4 w-4 text-[#0d9488]" />
              Role-based · audit-ready · decentralised
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-12 text-xs text-white/50">© {new Date().getFullYear()} MoHCC · FEPMS v1.0</div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-6 bg-white lg:bg-gray-50">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl lg:shadow-2xl overflow-hidden border border-gray-100">
          {/* Multicolor flag stripe */}
          <div className="h-2 w-full bg-gradient-to-r from-[#006400] via-[#FFD700] to-[#D40000]" style={{background: 'linear-gradient(90deg, #006400 0%, #FFD700 20%, #D40000 40%, #000000 60%, #D40000 75%, #FFD700 90%, #006400 100%)'}} />
          
          <div className="p-8 lg:p-10">
            {/* Mobile Logo */}
            <div className="flex flex-col items-center text-center gap-4 mb-8 lg:hidden">
              <img
                src="/MOHCC Designed logo.png"
                alt="MoHCC"
                className="h-20 w-20 object-contain"
              />
              <div className="text-xl font-bold tracking-tight text-gray-900">FEPMS</div>
            </div>
            
            <div className="mb-6 flex items-center gap-4">
                 <img
                   src="https://upload.wikimedia.org/wikipedia/commons/0/01/Coat_of_arms_of_Zimbabwe.svg"
                   alt="Zimbabwe Coat of Arms"
                   className="h-16 w-16 object-contain"
                 />
                 <div>
                   <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 font-semibold">Republic of Zimbabwe</div>
                   <div className="text-sm font-bold text-gray-800 leading-tight">Ministry of Health & Child Care</div>
                 </div>
               </div>
            
            <h2 className="text-3xl font-bold text-gray-900">Welcome back!</h2>
            <p className="text-gray-500 mt-2">Start managing your finance faster and better</p>

            <form onSubmit={handleSubmit} className="space-y-6 mt-10">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 group-focus-within:border-blue-200 transition-colors">
                      <Mail className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    required
                    className="w-full bg-[#f8fafc] border border-gray-100 rounded-2xl pl-16 pr-4 py-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <div className="h-10 w-10 rounded-lg bg-gray-50 flex items-center justify-center border border-gray-100 group-focus-within:border-blue-200 transition-colors">
                      <Lock className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full bg-[#f8fafc] border border-gray-100 rounded-2xl pl-16 pr-12 py-4 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-blue-400 focus:outline-none focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                <div className="flex justify-end">
                  <button type="button" className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline">
                    Forgot password?
                  </button>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#2563eb] text-white font-semibold text-lg rounded-2xl py-4 hover:bg-[#1d4ed8] active:scale-[0.99] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-200"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
              
              <p className="text-xs text-gray-400 text-center pt-4">
                Authorised personnel only. All actions are logged for security.
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* Flag Stripe (Right) */}
      <div className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-b from-[#006400] via-[#FFD700] to-[#D40000]" aria-hidden />
    </div>
  );
}
