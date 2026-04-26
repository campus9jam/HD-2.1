import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  Smartphone, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  ChevronLeft,
  Sparkles,
  Fingerprint
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { auth as firebaseAuth } from '../lib/firebase';

export default function LoginView() {
  const { signInWithGoogle, signInWithPhone } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [method, setMethod] = useState<'selection' | 'phone'>('selection');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  const from = (location.state as any)?.from?.pathname || '/';

  useEffect(() => {
    return () => {
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
    };
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const initRecaptcha = () => {
    if (!recaptchaRef.current) return;
    verifierRef.current = new RecaptchaVerifier(firebaseAuth, recaptchaRef.current, {
      size: 'invisible',
      callback: () => {
        // reCAPTCHA solved
      }
    });
  };

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    
    setLoading(true);
    setError(null);
    try {
      initRecaptcha();
      if (verifierRef.current) {
        const result = await signInWithPhone(phoneNumber, verifierRef.current);
        setConfirmationResult(result);
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed');
      if (verifierRef.current) {
        verifierRef.current.clear();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode || !confirmationResult) return;

    setLoading(true);
    setError(null);
    try {
      await confirmationResult.confirm(verificationCode);
      navigate(from, { replace: true });
    } catch (err: any) {
      setError('Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-gold/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-surface/40 backdrop-blur-3xl border border-text/5 rounded-[2.5rem] p-10 relative z-10 shadow-2xl"
      >
        <AnimatePresence mode="wait">
          {method === 'selection' ? (
            <motion.div 
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="space-y-10"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-gold/10 rounded-2xl flex items-center justify-center mx-auto border border-gold/20">
                  <Fingerprint className="w-8 h-8 text-gold" />
                </div>
                <h1 className="text-3xl font-serif italic text-text">Identity Hub</h1>
                <p className="text-[10px] uppercase font-black tracking-[0.4em] text-text/20">Sign in to sync your sovereign vault</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full h-16 bg-text text-bg rounded-2xl font-bold flex items-center justify-between px-8 hover:brightness-90 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Mail className="w-5 h-5" />
                    <span>Continue with Google</span>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>

                <button
                  onClick={() => setMethod('phone')}
                  className="w-full h-16 bg-text/5 border border-text/10 text-text rounded-2xl font-bold flex items-center justify-between px-8 hover:bg-text/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <Smartphone className="w-5 h-5" />
                    <span>Connect Phone Number</span>
                  </div>
                  <ArrowRight className="w-5 h-5 opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                </button>
              </div>

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-black text-center tracking-widest">
                  {error}
                </div>
              )}

              <p className="text-center text-[10px] text-text/10 uppercase font-bold tracking-[0.2em] leading-relaxed px-4">
                By entering the Hub, you adhere to the sovereign protocols of the House of Daraja.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              key="phone"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <button 
                onClick={() => {
                  setMethod('selection');
                  setConfirmationResult(null);
                  setVerificationCode('');
                }}
                className="flex items-center gap-2 text-text/40 hover:text-text transition-colors text-[10px] font-black uppercase tracking-widest"
              >
                <ChevronLeft className="w-4 h-4" /> Back to selection
              </button>

              <div className="space-y-2">
                <h2 className="text-2xl font-serif italic text-text">
                  {confirmationResult ? 'Verification' : 'Phone Synchronization'}
                </h2>
                <p className="text-[10px] uppercase font-black tracking-widest text-text/20">
                  {confirmationResult ? 'Enter the pulse code sent to your device' : 'Enter your international identity number'}
                </p>
              </div>

              {!confirmationResult ? (
                <form onSubmit={handlePhoneSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-gold tracking-widest px-1">Identity Number</label>
                    <input 
                      type="tel" 
                      placeholder="+234 ..." 
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="w-full h-16 bg-text/5 border border-text/10 rounded-2xl px-6 font-mono text-text placeholder:text-text/10 focus:border-gold/50 outline-none transition-all"
                      required
                    />
                  </div>
                  <div id="recaptcha-container" ref={recaptchaRef}></div>
                  <button
                    disabled={loading || !phoneNumber}
                    className="w-full h-16 bg-gold text-navy rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Secure Sync</span>
                        <ShieldCheck className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleVerifyCode} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] uppercase font-black text-gold tracking-widest px-1">Pulse Code</label>
                    <input 
                      type="text" 
                      placeholder="XXXXXX" 
                      maxLength={6}
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value)}
                      className="w-full h-16 bg-text/5 border border-text/10 rounded-2xl px-6 font-mono text-text text-center text-2xl tracking-[1em] placeholder:text-text/10 focus:border-gold/50 outline-none transition-all"
                      required
                    />
                  </div>
                  <button
                    disabled={loading || verificationCode.length < 6}
                    className="w-full h-16 bg-text text-bg rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-bg border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Verify Identity</span>
                        <LogIn className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] uppercase font-black text-center tracking-widest">
                  {error}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Footer Branded Elements */}
      <div className="absolute bottom-10 left-10 opacity-20 hidden md:block">
        <Sparkles className="w-24 h-24 text-gold/20 absolute -top-12 -left-12 animate-pulse" />
        <span className="text-[10px] font-black uppercase tracking-[1em] text-white/40 rotate-90 origin-left">Protocol Security: Active</span>
      </div>
    </div>
  );
}
