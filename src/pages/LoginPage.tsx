import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, User, Lock, Loader2, KeyRound, UserPlus, LogIn, Mail } from 'lucide-react';
import { Role } from '../types';

export default function LoginPage() {
  const { login, registerMember, setIsGlobalLoading } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    if (isRegister && !email) return;
    
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await registerMember(username, password, email);
      } else {
        await login(username, password, Role.Member);
      }
      setIsGlobalLoading(true);
      navigate('/');
    } catch (err: any) {
      setError(err.message || t('login_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-base)] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-8 sm:p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] opacity-20" />
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center overflow-hidden">
            <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-text-main)]">
            {isRegister ? 'Join a Shelf' : t('login_title')}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1 text-[10px] font-bold uppercase tracking-widest">
            {isRegister ? 'Register as a new member' : t('shared_household_access')}
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-[var(--color-background-base)] p-1 rounded-2xl mb-8 border border-[var(--color-border-subtle)]">
          <button 
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${!isRegister ? 'bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}
          >
            <LogIn size={14} />
            {t('login_btn')}
          </button>
          <button 
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isRegister ? 'bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}
          >
            <UserPlus size={14} />
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="relative">
              <User className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                <input
                  type="text"
                  placeholder={t('username')}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm"
                  required
                />
            </div>


            <AnimatePresence mode="wait">
              {isRegister && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative overflow-hidden mb-4"
                >
                  <Mail className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                  <input
                    type="email"
                    placeholder="Your Email (for security alerts)"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm"
                    required={isRegister}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Lock className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
                <input
                  type="password"
                  placeholder={isRegister ? "Create Password" : t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm"
                  required
                />
            </div>
          </div>

          {error && <p className="text-red-600 text-[10px] font-bold text-center uppercase tracking-widest">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : null}
            <span className="uppercase tracking-[0.15em] text-xs font-black">
              {isRegister ? 'Register & Join' : t('login_btn')}
            </span>
          </button>

          {!isRegister && (
            <p className="text-zinc-400 text-[10px] text-center leading-relaxed">
              Use your personal member credentials to access the shelf.
            </p>
          )}

          <div className="mt-8 text-center pt-6 border-t border-[var(--color-border-subtle)]">
            <button 
              type="button" 
              onClick={() => navigate('/admin/login')} 
              className="text-[10px] text-[var(--color-primary)] font-bold uppercase tracking-widest hover:underline"
            >
              {t('admin_login_setup')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
