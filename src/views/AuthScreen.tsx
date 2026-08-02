import { useState, useEffect } from 'react';
import { User, Store, Mail, Lock, MapPin, AlertCircle, Sprout, Eye, EyeOff, CheckCircle2, TrendingUp, ShieldCheck, Loader2 } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import RegionProvinceSelector from '@/components/RegionProvinceSelector';
import ThemeToggle from '@/components/ThemeToggle';
import type { AccountType } from '@/types';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const HERO_IMAGE = 'https://images.pexels.com/photos/29682473/pexels-photo-29682473.jpeg?auto=compress&cs=tinysrgb&h=1200&w=800';

export default function AuthScreen() {
  const { signIn, signUp } = useApp();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [accountType, setAccountType] = useState<AccountType>('customer');
  const [name, setName] = useState('');
  const [farmName, setFarmName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('');
  const [province, setProvince] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setError('');
    setSuccess('');
  }, [mode, accountType]);

  const resetForm = () => {
    setName('');
    setFarmName('');
    setEmail('');
    setPassword('');
    setRegion('');
    setProvince('');
    setMunicipality('');
    setError('');
    setSuccess('');
  };

  const handleSignIn = async () => {
    setError('');
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    setBusy(true);
    const { error: signInError } = await signIn(email.trim(), password, rememberMe);
    setBusy(false);
    if (signInError) {
      setError(signInError.includes('Invalid login') ? 'Incorrect email or password.' : signInError);
    }
  };

  const handleSignUp = async () => {
    setError('');
    setSuccess('');
    if (!name.trim() || !email.trim() || !password.trim() || !region || !province) {
      setError('Please fill in all required fields.');
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (accountType === 'dealer' && !farmName.trim()) {
      setError('Farm/Store name is required for dealers.');
      return;
    }
    setBusy(true);
    const { error: signUpError } = await signUp({
      accountType,
      name: name.trim(),
      email: email.trim(),
      password,
      region,
      province,
      municipality: municipality.trim(),
      farmName: accountType === 'dealer' ? farmName.trim() : undefined,
    });
    setBusy(false);
    if (signUpError) {
      setError(signUpError.includes('already') ? 'An account with this email already exists.' : signUpError);
      return;
    }
    setSuccess('Account created! You are now signed in.');
    resetForm();
  };

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--bg)' }}>
      {/* Branding panel — hidden on mobile, shown on lg */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <img
          src={HERO_IMAGE}
          alt="Philippine countryside livestock farm"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(160deg, rgba(20,60,30,0.78) 0%, rgba(30,80,40,0.55) 50%, rgba(15,50,25,0.85) 100%)' }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center">
              <Sprout size={26} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-xl font-bold">Local Livestock</span>
              <span className="text-xs font-medium tracking-widest uppercase text-white/70">Provincial Trading</span>
            </div>
          </div>

          <div className="max-w-md">
            <h1 className="text-4xl font-bold leading-tight mb-4">
              Connecting Filipino farmers with buyers across every province.
            </h1>
            <p className="text-lg text-white/80 leading-relaxed">
              Buy and sell livestock batches — poultry, swine, cattle, and more — with transparent pricing and direct dealer contact.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-md">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <TrendingUp size={22} className="mb-2 text-white/90" />
              <p className="text-sm font-semibold">Live Marketplace</p>
              <p className="text-xs text-white/60 mt-0.5">Real-time stock</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <CheckCircle2 size={22} className="mb-2 text-white/90" />
              <p className="text-sm font-semibold">Direct Offers</p>
              <p className="text-xs text-white/60 mt-0.5">No middlemen</p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <ShieldCheck size={22} className="mb-2 text-white/90" />
              <p className="text-sm font-semibold">Verified Dealers</p>
              <p className="text-xs text-white/60 mt-0.5">Star ratings</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form panel */}
      <div className="w-full lg:w-1/2 flex flex-col">
        {/* Mobile header with branding */}
        <div className="lg:hidden flex items-center justify-between px-4 sm:px-6 py-4"
          style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface)' }}>
          <div className="flex items-center gap-2.5">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-sm"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              <Sprout size={22} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-base font-bold" style={{ color: 'var(--text)' }}>Local Livestock</span>
              <span className="text-[11px] font-medium tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>Provincial Trading</span>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-6 sm:py-10 overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Desktop theme toggle */}
            <div className="hidden lg:flex justify-end mb-4">
              <ThemeToggle />
            </div>

            <div className="card p-6 sm:p-8 animate-slide-up shadow-xl">
              <div className="mb-6">
                <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
                  {mode === 'signin' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {mode === 'signin' ? 'Sign in to continue trading.' : 'Join the provincial livestock marketplace.'}
                </p>
              </div>

              <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ backgroundColor: 'var(--bg)' }}>
                <button
                  onClick={() => setMode('signin')}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px]"
                  style={mode === 'signin' ? { backgroundColor: 'var(--primary)', color: 'white' } : { color: 'var(--text-muted)' }}
                >
                  Sign In
                </button>
                <button
                  onClick={() => setMode('signup')}
                  className="flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all min-h-[44px]"
                  style={mode === 'signup' ? { backgroundColor: 'var(--primary)', color: 'white' } : { color: 'var(--text-muted)' }}
                >
                  Create Account
                </button>
              </div>

              {mode === 'signup' && (
                <div className="mb-5">
                  <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>Account Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setAccountType('customer')}
                      className="p-3 rounded-xl text-left transition-all min-h-[56px]"
                      style={{
                        border: accountType === 'customer' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: accountType === 'customer' ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <User size={16} style={{ color: 'var(--text)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Customer</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Buy livestock</p>
                    </button>
                    <button
                      onClick={() => setAccountType('dealer')}
                      className="p-3 rounded-xl text-left transition-all min-h-[56px]"
                      style={{
                        border: accountType === 'dealer' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        backgroundColor: accountType === 'dealer' ? 'color-mix(in srgb, var(--primary) 8%, transparent)' : 'transparent',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-0.5">
                        <Store size={16} style={{ color: 'var(--text)' }} />
                        <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Dealer</span>
                      </div>
                      <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Sell livestock</p>
                    </button>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <User size={13} /> Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Juan Dela Cruz"
                      className="input-field"
                    />
                  </div>
                )}

                {mode === 'signup' && accountType === 'dealer' && (
                  <div>
                    <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                      <Store size={13} /> Farm / Store Name
                    </label>
                    <input
                      type="text"
                      value={farmName}
                      onChange={(e) => setFarmName(e.target.value)}
                      placeholder="Dela Cruz Poultry Farm"
                      className="input-field"
                    />
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Mail size={13} /> Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="input-field"
                    onKeyDown={(e) => e.key === 'Enter' && mode === 'signin' && handleSignIn()}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Lock size={13} /> Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="input-field pr-10"
                      onKeyDown={(e) => e.key === 'Enter' && mode === 'signin' && handleSignIn()}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 min-h-[44px] min-w-[28px] flex items-center justify-center"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {mode === 'signup' && (
                  <>
                    <RegionProvinceSelector
                      region={region}
                      province={province}
                      onRegionChange={setRegion}
                      onProvinceChange={setProvince}
                      provinceLabel={accountType === 'dealer' ? 'Province Location' : 'Default Province'}
                    />
                    <div>
                      <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5" style={{ color: 'var(--text-muted)' }}>
                        <MapPin size={13} /> Municipality / Barangay / Street
                      </label>
                      <input
                        type="text"
                        value={municipality}
                        onChange={(e) => setMunicipality(e.target.value)}
                        placeholder="e.g. Trece Martires, Brgy. San Agustin"
                        className="input-field"
                      />
                    </div>
                  </>
                )}

                {mode === 'signin' && (
                  <label className="flex items-center gap-2.5 cursor-pointer select-none py-1">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer"
                      style={{ accentColor: 'var(--primary)' }}
                    />
                    <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Remember me — stay logged in across refreshes</span>
                  </label>
                )}

                {error && (
                  <div className="p-3 rounded-lg flex items-center gap-2 text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--error) 10%, transparent)', color: 'var(--error)' }}>
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="p-3 rounded-lg flex items-center gap-2 text-sm" style={{ backgroundColor: 'color-mix(in srgb, var(--success) 10%, transparent)', color: 'var(--success)' }}>
                    <CheckCircle2 size={16} />
                    {success}
                  </div>
                )}

                <button
                  onClick={mode === 'signin' ? handleSignIn : handleSignUp}
                  disabled={busy}
                  className="btn-primary w-full py-3 min-h-[48px] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {busy && <Loader2 size={18} className="animate-spin" />}
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                </button>
              </div>

              <p className="text-center text-xs mt-5" style={{ color: 'var(--text-muted)' }}>
                {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
                <button
                  onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); resetForm(); }}
                  className="font-semibold underline"
                  style={{ color: 'var(--primary)' }}
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
