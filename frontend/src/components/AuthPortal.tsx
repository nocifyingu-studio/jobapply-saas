import { useState } from 'react';
import { Mail, Lock, Phone, Key, ArrowLeft, Loader2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export default function AuthPortal({ mode, onBack, onComplete }: { mode: 'login' | 'signup'; onBack: () => void; onComplete: () => void }) {
  const [tab, setTab] = useState<'email' | 'phone' | 'forgot'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const executeGoogleOAuth = async () => {
    setSubmitting(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
    if (error) setNotice({ type: 'error', msg: error.message });
    setSubmitting(false);
  };

  const dispatchMobileOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setNotice(null);
    const cleanPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.signInWithOtp({ phone: cleanPhone });
    if (error) {
      setNotice({ type: 'error', msg: error.message });
    } else {
      setOtpSent(true);
      setNotice({ type: 'success', msg: "SMS verification token sent successfully to your device." });
    }
    setSubmitting(false);
  };

  const confirmMobileOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const cleanPhone = phone.startsWith('+') ? phone : `+91${phone}`;
    const { error } = await supabase.auth.verifyOtp({ phone: cleanPhone, token: otp, type: 'sms' });
    if (error) setNotice({ type: 'error', msg: error.message });
    else onComplete();
    setSubmitting(false);
  };

  const processPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) setNotice({ type: 'error', msg: error.message });
    else setNotice({ type: 'success', msg: "Cryptographic email reset link dispatched. Check your inbox." });
    setSubmitting(false);
  };

  const processEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const { error } = mode === 'signup' 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });
    if (error) setNotice({ type: 'error', msg: error.message });
    else onComplete();
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <button onClick={onBack} className="absolute top-6 left-6 text-sm text-slate-400 hover:text-white flex items-center gap-2"><ArrowLeft className="h-4 w-4" /> Home</button>
      <div className="w-full max-w-md p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
        <h2 className="text-2xl font-bold text-center text-white">{tab === 'forgot' ? 'Recover Access' : mode === 'signup' ? 'Create Premium Account' : 'Welcome Back'}</h2>
        {notice && <div className={`p-4 rounded-xl text-xs border ${notice.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>{notice.msg}</div>}
        
        {tab !== 'forgot' && (
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 gap-1">
            <button onClick={() => setTab('email')} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${tab === 'email' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Email</button>
            <button onClick={() => setTab('phone')} className={`flex-1 py-2 text-xs font-semibold rounded-lg ${tab === 'phone' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}>Mobile OTP</button>
          </div>
        )}

        {tab !== 'forgot' && <button onClick={executeGoogleOAuth} className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-800 text-sm font-semibold flex items-center justify-center gap-3 text-white hover:bg-slate-900">Continue with Google</button>}

        {tab === 'email' && (
          <form onSubmit={processEmailAuth} className="space-y-4">
            <div className="space-y-1"><label className="text-xs text-slate-400">Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" /></div>
            <div className="space-y-1"><div className="flex justify-between"><label className="text-xs text-slate-400">Password</label><button type="button" onClick={() => setTab('forgot')} className="text-xs text-indigo-400">Forgot?</button></div><input type="password" required value={password} onChange={e => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" /></div>
            <button type="submit" disabled={submitting} className="w-full py-3 rounded-xl bg-emerald-400 font-bold text-slate-950 text-sm">{submitting ? 'Authenticating...' : mode === 'signup' ? 'Register Account' : 'Sign In'}</button>
          </form>
        )}

        {tab === 'phone' && (
          <form onSubmit={otpSent ? confirmMobileOTP : dispatchMobileOTP} className="space-y-4">
            <div className="space-y-1"><label className="text-xs text-slate-400">Indian Mobile Number</label><input type="tel" required disabled={otpSent} value={phone} onChange={e => setPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" placeholder="9876543210" /></div>
            {otpSent && <div className="space-y-1"><label className="text-xs text-slate-400">6-Digit SMS OTP</label><input type="text" required value={otp} onChange={e => setOtp(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white text-center font-mono" placeholder="000000" maxLength={6} /></div>}
            <button type="submit" className="w-full py-3 rounded-xl bg-indigo-500 font-bold text-white text-sm">{otpSent ? 'Verify Code' : 'Send Verification OTP'}</button>
          </form>
        )}

        {tab === 'forgot' && (
          <form onSubmit={processPasswordReset} className="space-y-4">
            <div className="space-y-1"><label className="text-xs text-slate-400">Account Email Address</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-sm text-white" /></div>
            <button type="submit" className="w-full py-3 rounded-xl bg-slate-800 border border-slate-700 text-white text-sm">Send Reset Email</button>
            <button type="button" onClick={() => setTab('email')} className="w-full text-center text-xs text-slate-400 pt-2">Return to Login</button>
          </form>
        )}
      </div>
    </div>
  );
}
