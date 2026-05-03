import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Lock, Loader2, Mail, KeyRound, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Role } from '../types';
import { cn } from '../lib/utils';
import { emailService } from '../services/emailService';

export default function AdminLoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  
  const [showOtp, setShowOtp] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [targetEmail, setTargetEmail] = useState('');

  const generateAndSendOtp = async (destEmail: string) => {
    const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newOtp);
    setTargetEmail(destEmail);
    
    try {
      await emailService.sendOTP(destEmail, newOtp);
      setSuccess(`OTP sent to ${destEmail}`);
      setShowOtp(true);
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP. Please check your EmailJS configuration.");
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError('');
    await generateAndSendOtp(targetEmail || email);
    setResending(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (isRegister && !email) {
      setError("Email is required for Admin Registration");
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (showOtp) {
        if (otp !== generatedOtp) {
          setError("Invalid OTP. Please try again.");
          setLoading(false);
          return;
        }
        // OTP verified, complete login
        await login(username, password, Role.Admin, email, true);
        navigate('/admin');
      } else {
        const result = await login(username, password, Role.Admin, email, false);
        if (result?.requiresOtp) {
          await generateAndSendOtp(result.email || email);
        } else {
          navigate('/admin');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Admin login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-base)] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-2 border-[var(--color-primary)]/20"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)]" />
        
        {/* Mode Toggle */}
        {!showOtp && (
          <div className="flex bg-[var(--color-background-base)] p-1 rounded-2xl mb-10 shadow-inner">
            <button 
              onClick={() => { setIsRegister(false); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                !isRegister ? "bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)]"
              )}
            >
              Admin Login
            </button>
            <button 
              onClick={() => { setIsRegister(true); setError(''); }}
              className={cn(
                "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                isRegister ? "bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)]"
              )}
            >
              {t('create_new')}
            </button>
          </div>
        )}

        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-3xl font-bold font-display text-[var(--color-text-main)]">
            {showOtp ? "Verify OTP" : (isRegister ? t('setup_fridge') : 'Admin Login')}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-xs font-bold uppercase tracking-widest">
            {showOtp ? "Check your email for the code" : (isRegister ? t('new_fridge_desc') : "Manage Your Household")}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <AnimatePresence mode="popLayout">
            {!showOtp ? (
              <motion.div 
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-5"
              >
                <div className="relative">
                  <User className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                  <input
                    type="text"
                    id="admin-username"
                    name="username"
                    placeholder={t('username')}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm shadow-xs"
                    required
                  />
                </div>
                {isRegister && (
                  <div className="relative">
                    <Mail className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                    <input
                      type="email"
                      id="admin-email"
                      name="email"
                      placeholder="Admin Email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm shadow-xs"
                      required={isRegister}
                    />
                  </div>
                )}
                <div className="relative">
                  <Lock className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                  <input
                    type="password"
                    id="admin-password"
                    name="password"
                    placeholder={t('password')}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm shadow-xs"
                    required
                  />
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-5"
              >
                <div className="relative">
                  <KeyRound className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                  <input
                    type="text"
                    id="admin-otp"
                    name="otp"
                    placeholder="Enter 6-digit OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-bold text-center text-lg tracking-[0.5em] shadow-xs"
                    required
                  />
                </div>
                <button 
                  type="button"
                  onClick={() => setShowOtp(false)}
                  className="w-full py-2 text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-widest hover:text-[var(--color-text-main)]"
                >
                  Cancel & Go Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-red-600 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}
          {success && (
            <div className="flex items-center justify-center gap-2 text-green-600 text-[10px] font-bold uppercase tracking-widest bg-green-50 py-2 rounded-lg border border-green-100">
              <CheckCircle2 size={14} />
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || (showOtp && otp.length !== 6)}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : null}
            <span className="uppercase tracking-[0.15em] text-xs font-black">
              {showOtp ? 'Verify OTP' : (isRegister ? t('create_fridge_btn') : t('login_btn'))}
            </span>
          </button>

          {showOtp && (
            <div className="flex justify-center">
              <button 
                type="button"
                onClick={handleResendOtp}
                disabled={resending}
                className="flex items-center gap-2 text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest hover:underline disabled:opacity-50"
              >
                {resending ? <RefreshCw className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                Resend OTP
              </button>
            </div>
          )}

          {!showOtp && (
            <p className="text-zinc-400 text-[10px] text-center leading-relaxed">
              {isRegister 
                ? "Share this password with members to grant them access."
                : "An OTP will be sent to the admin email for verification."
              }
            </p>
          )}

          <div className="mt-8 text-center pt-6 border-t border-[var(--color-border-subtle)]">
            <button 
              type="button" 
              onClick={() => navigate('/login')} 
              className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest hover:underline"
            >
              Back to Member Login
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
