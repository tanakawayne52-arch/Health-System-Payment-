import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mesh gradient animation
  useEffect(() => {
    if (!containerRef.current) return;
    let t = 0;
    const frameRef = { current: 0 };

    function computePositions(t: number) {
      return {
        x1: 50 + 30 * Math.sin(t / 1200),
        y1: 50 + 30 * Math.cos(t / 1400),
        x2: 50 + 30 * Math.cos(t / 1000),
        y2: 50 + 30 * Math.sin(t / 1600),
        x3: 50 + 30 * Math.sin(t / 1800),
        y3: 50 + 30 * Math.cos(t / 1100),
        x4: 50 + 30 * Math.cos(t / 1300),
        y4: 50 + 30 * Math.sin(t / 1500),
      };
    }

    function animate() {
      t += 1;
      const pos = computePositions(t);
      if (containerRef.current) {
        containerRef.current.style.setProperty('--x-1', `${pos.x1}%`);
        containerRef.current.style.setProperty('--y-1', `${pos.y1}%`);
        containerRef.current.style.setProperty('--x-2', `${pos.x2}%`);
        containerRef.current.style.setProperty('--y-2', `${pos.y2}%`);
        containerRef.current.style.setProperty('--x-3', `${pos.x3}%`);
        containerRef.current.style.setProperty('--y-3', `${pos.y3}%`);
        containerRef.current.style.setProperty('--x-4', `${pos.x4}%`);
        containerRef.current.style.setProperty('--y-4', `${pos.y4}%`);
      }
      frameRef.current = requestAnimationFrame(animate);
    }

    frameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frameRef.current);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/');
      } else {
        setError('Invalid credentials. Please try again.');
        setShake(true);
        setTimeout(() => setShake(false), 500);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Column - Logo & Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#166534] via-[#15803d] to-[#14532d] relative items-center justify-center overflow-hidden">
        <div ref={containerRef} className="mesh-gradient-container absolute inset-0 overflow-hidden opacity-30">
          <div className="mesh-layer mesh-primary absolute inset-0" />
          <div className="mesh-layer mesh-secondary absolute inset-0" />
        </div>

        <div className="relative z-10 text-center px-8 max-w-sm space-y-6">
          {/* Logo Container - Fitted to logo shape */}
          <div className="flex justify-center">
            <div className="w-40 h-40 rounded-2xl bg-white flex items-center justify-center overflow-hidden p-3 shadow-lg border border-white/10">
              <img
                src="/MOHCC Designed logo.png"
                alt="MoHCC Emblem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Branding Text */}
          <div>
            <h1 className="text-white font-extrabold text-3xl tracking-tight mb-2">FEPMS</h1>
            <p className="text-white/80 text-sm mb-2">Front-End Payment Management System</p>
            <p className="text-[#4ee9d8] font-medium text-xs mb-4">Ministry of Health and Child Care</p>
            <div className="w-16 h-px bg-white/20 mx-auto mb-3" />
            <p className="text-white/60 text-xs italic">Delivering Healthcare Excellence</p>
          </div>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center bg-white p-6">
        <div className={`w-full max-w-sm ${shake ? 'animate-shake' : ''}`}>
          <div className="lg:hidden text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-4 rounded-xl bg-white flex items-center justify-center overflow-hidden p-1.5 border border-[#e5e7eb]">
              <img
                src="/MOHCC Designed logo.png"
                alt="MoHCC Emblem"
                className="w-full h-full object-contain"
              />
            </div>
            <h1 className="text-[#166534] font-bold text-xl">FEPMS</h1>
            <p className="text-[#6b7280] text-xs">Ministry of Health and Child Care</p>
          </div>

          <div className="mb-8">
            <h2 className="text-[#1e293b] font-bold text-4xl mb-2">Secure Sign In</h2>
            <p className="text-[#6b7280] text-base">Enter your credentials to securely access FEPMS.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-[#dc2626] text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-2 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-white border border-[#d1d5db] rounded-lg px-4 py-3 text-base text-[#1e293b] placeholder:text-[#9ca3af] focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1e293b] mb-2 uppercase tracking-wide">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white border border-[#d1d5db] rounded-lg px-4 py-3 text-base text-[#1e293b] placeholder:text-[#9ca3af] focus:border-[#16a34a] focus:outline-none focus:ring-2 focus:ring-[#16a34a]/30 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6b7280] hover:text-[#1e293b]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#16a34a] text-white font-semibold text-lg rounded-lg py-3 hover:bg-[#15803d] active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : null}
              Sign In
            </button>

            <div className="text-center">
              <a href="#" className="text-[#16a34a] hover:text-[#15803d] text-sm font-medium">
                Forgot password?
              </a>
            </div>


          </form>
        </div>
      </div>
    </div>
  );
}
