import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Phone, Armchair, Loader2, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; // adjust path if AuthContext lives elsewhere

export default function AdminLogin({ onSuccess }) {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({ mobileNumber: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  // Client-side validation matching backend constraints
  const validateForm = () => {
    const newErrors = {};
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.mobileNumber) {
      newErrors.mobileNumber = 'Mobile number is required';
    } else if (!phoneRegex.test(formData.mobileNumber)) {
      newErrors.mobileNumber = 'Must be a valid 10-digit number';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'mobileNumber' && value !== '' && !/^[0-9\b]+$/.test(value)) return;
    if (name === 'mobileNumber' && value.length > 10) return;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
    if (serverError) setServerError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setServerError('');

    try {
      // Goes through AuthContext.login(), which calls the configured axios
      // instance AND updates the shared `user` state — calling loginAdmin()
      // directly here would store the token but leave Navbar/AuthContext
      // unaware a login happened until a full page reload.
      const admin = await login(formData);
      console.log("Login success — admin returned:", admin);
      onSuccess?.(admin);
      navigate('/');
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || 'Authentication failed';
      setServerError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full font-sans selection:bg-amber-700/40 selection:text-amber-200 bg-[#0c0a09]">
      <div className="relative min-h-screen w-full lg:grid lg:grid-cols-[1.1fr_1fr]">

        {/* Left / Brand Panel — hidden on mobile, hero on desktop */}
        <div className="relative hidden lg:flex flex-col justify-between overflow-hidden px-14 py-12 border-r border-[#2a221c]">
          <div
            className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center scale-105"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-[#0c0a09]/85 to-[#0c0a09]/50" />
          </div>

          <div className="relative z-10 flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-full bg-[#1c1815]/80 border border-[#4a3b32]">
              <Armchair className="w-5 h-5 text-[#fcd34d] stroke-[1.5]" />
            </div>
            <span className="text-[13px] font-semibold tracking-[0.25em] text-[#e8dcc8] uppercase">
              Lifestyle Store
            </span>
          </div>

          <div className="relative z-10 max-w-md">
            <p className="text-[11px] font-semibold tracking-[0.3em] text-[#c48b60] uppercase mb-4">
              Management Suite
            </p>
            <h1 className="text-4xl font-bold leading-tight text-[#f5ebd9] mb-4 text-balance">
              Every room starts with what's behind the counter.
            </h1>
            <p className="text-sm leading-relaxed text-[#a68a7c]">
              Sign in to manage inventory, orders, and storefront categories
              across the collection.
            </p>
          </div>

          <p className="relative z-10 text-[10px] font-mono tracking-[0.2em] text-[#6b5b4f] uppercase">
            Secure Retail Data // AES-256 Encryption
          </p>
        </div>

        {/* Right / Form Panel */}
        <div className="relative flex items-center justify-center px-5 py-10 sm:px-8">
          {/* Mobile-only background, mirrors old design but lighter blur */}
          <div className="absolute inset-0 lg:hidden bg-[url('https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=2000&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[6px]" />
          </div>

          <div className="relative z-10 w-full max-w-[400px]">

            {/* Mobile-only header (desktop gets the left panel instead) */}
            <div className="flex lg:hidden flex-col items-center text-center mb-8">
              <div className="relative flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-[#3d2e25] to-[#1c1815] border border-[#725442] shadow-[0_0_20px_rgba(180,105,55,0.15)] mb-4">
                <Shield className="absolute w-9 h-9 text-[#a67c52] stroke-[1]" />
                <Armchair className="w-4 h-4 text-[#fcd34d] stroke-[1.5] mt-1 z-10 drop-shadow-md" />
              </div>
              <h1 className="text-lg font-bold tracking-widest text-[#f5ebd9] uppercase">
                Lifestyle Store
              </h1>
              <p className="text-[11px] text-[#a68a7c] uppercase tracking-wider font-medium mt-1">
                Management Suite Access
              </p>
            </div>

            <div className="hidden lg:block mb-8">
              <h2 className="text-2xl font-bold text-[#f5ebd9] mb-1.5">
                Welcome back
              </h2>
              <p className="text-sm text-[#a68a7c]">
                Enter your credentials to access the dashboard.
              </p>
            </div>

            {serverError && (
              <div
                role="alert"
                className="mb-6 px-4 py-3 rounded-lg bg-red-950/40 border border-red-900/50 flex items-center justify-center"
              >
                <p className="text-[13px] text-red-400 font-medium tracking-wide">
                  {serverError}
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label
                  htmlFor="mobileNumber"
                  className="text-[11px] font-semibold text-[#b89f8d] tracking-widest uppercase"
                >
                  Registered Phone Number
                </label>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7a6456] group-focus-within:text-[#c48b60] transition-colors duration-300">
                    <Phone className="w-[18px] h-[18px] stroke-[1.5]" />
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    name="mobileNumber"
                    id="mobileNumber"
                    autoComplete="tel"
                    value={formData.mobileNumber}
                    onChange={handleChange}
                    placeholder="Enter 10 digit number"
                    aria-invalid={!!errors.mobileNumber}
                    className={`w-full pl-11 pr-4 py-3.5 bg-[#14110f]/80 border rounded-lg text-sm text-[#f5ebd9] placeholder-[#5c4f45] focus:outline-none focus:ring-1 transition-all duration-300 ${
                      errors.mobileNumber
                        ? 'border-red-900/60 focus:ring-red-700/50 focus:border-red-700/60'
                        : 'border-[#3a2e28] focus:ring-[#c48b60]/40 focus:border-[#c48b60]/70'
                    }`}
                  />
                </div>
                {errors.mobileNumber && (
                  <p className="text-[11px] text-red-400/90 font-medium tracking-wide mt-1 pl-1">
                    {errors.mobileNumber}
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="text-[11px] font-semibold text-[#b89f8d] tracking-widest uppercase"
                  >
                    Password
                  </label>
                  <button
                    type="button"
                    tabIndex={-1}
                    className="text-[11px] font-medium text-[#c48b60] hover:text-[#e0a877] transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative group">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#7a6456] group-focus-within:text-[#c48b60] transition-colors duration-300">
                    <Lock className="w-[18px] h-[18px] stroke-[1.5]" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    id="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    aria-invalid={!!errors.password}
                    className={`w-full pl-11 pr-11 py-3.5 bg-[#14110f]/80 border rounded-lg text-sm text-[#f5ebd9] placeholder-[#5c4f45] focus:outline-none focus:ring-1 transition-all duration-300 ${
                      errors.password
                        ? 'border-red-900/60 focus:ring-red-700/50 focus:border-red-700/60'
                        : 'border-[#3a2e28] focus:ring-[#c48b60]/40 focus:border-[#c48b60]/70'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#7a6456] hover:text-[#b89f8d] transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="w-[18px] h-[18px]" />
                    ) : (
                      <Eye className="w-[18px] h-[18px]" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[11px] text-red-400/90 font-medium tracking-wide mt-1 pl-1">
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading}
                className="relative w-full mt-2 overflow-hidden rounded-lg group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c48b60] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0c0a09]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#b56f3f] via-[#d48b57] to-[#b56f3f] transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="relative flex items-center justify-center gap-2 px-4 py-3.5 bg-black/10 backdrop-blur-sm text-[#fffdfc] text-sm font-bold tracking-widest uppercase transition-all duration-200 active:scale-[0.99] disabled:opacity-70 disabled:pointer-events-none">
                  {isLoading ? (
                    <>
                      <Loader2 className="w-[18px] h-[18px] animate-spin" />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </div>
              </button>
            </form>

            <div className="lg:hidden mt-8 pt-6 border-t border-[#3a2e28] text-center">
              <p className="text-[9px] font-mono tracking-[0.2em] text-[#7a6456] uppercase">
                Secure Retail Data // AES-256 Encryption
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}