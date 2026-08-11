import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import LandingPage from './components/LandingPage';
import Dashboard from './components/Dashboard';
import AuthPortal from './components/AuthPortal';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

declare global {
  interface Window { Razorpay: any; }
}

export default function App() {
  const [sessionUser, setSessionUser] = useState<any>(null);
  const [viewState, setViewState] = useState<'landing' | 'auth' | 'dashboard'>('landing');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('signup');

  // Monitors database state sessions to handle Google Redirects and logins automatically
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setSessionUser(session.user);
        setViewState('dashboard');
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setSessionUser(session.user);
        setViewState('dashboard');
      } else {
        setSessionUser(null);
        setViewState('landing');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const triggerRazorpayPayment = useCallback((tier: 'pro' | 'elite') => {
    if (!window.Razorpay) {
      alert("Initializing transaction infrastructure... Please wait.");
      return;
    }

    const checkoutOptions = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: tier === 'elite' ? "249900" : "77700", // Dynamic separation thresholds handled natively
      currency: "INR",
      name: "AFFINITII GLOBAL",
      description: tier === 'elite' ? "Elite Automation License Plan" : "Pro Automation License Plan",
      handler: function (response: any) {
        if (response.razorpay_payment_id) {
          setAuthMode('signup');
          setViewState('auth');
        }
      },
      theme: { color: "#4f46e5" }
    };

    const rzp = new window.Razorpay(checkoutOptions);
    rzp.open();
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {viewState === 'landing' && (
        <LandingPage onGetStarted={() => setViewState('auth')} onSubscribe={triggerRazorpayPayment} />
      )}
      {viewState === 'auth' && (
        <AuthPortal mode={authMode} onBack={() => setViewState('landing')} onComplete={() => setViewState('dashboard')} />
      )}
      {viewState === 'dashboard' && sessionUser && (
        <Dashboard user={sessionUser} onSignOut={async () => { await supabase.auth.signOut(); }} />
      )}
    </div>
  );
}
