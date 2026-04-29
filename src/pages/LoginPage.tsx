import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Shield, User, Lock, Loader2 } from 'lucide-react';
import { Role } from '../types';
import { cn } from '../lib/utils';

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.Member);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [isRegister, setIsRegister] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    setLoading(true);
    setError('');
    try {
      if (isRegister) {
        await login(username, password, Role.Admin);
      } else {
        await login(username, password, role);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background-base)] p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full glass p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-[var(--color-primary)] opacity-20" />
        
        {/* Mode Toggle */}
        <div className="flex bg-[var(--color-background-base)] p-1 rounded-2xl mb-10 shadow-inner">
          <button 
            onClick={() => setIsRegister(false)}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              !isRegister ? "bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)]"
            )}
          >
            {t('join_fridge')}
          </button>
          <button 
            onClick={() => {
              setIsRegister(true);
              setRole(Role.Admin);
            }}
            className={cn(
              "flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
              isRegister ? "bg-[var(--color-card-bg)] text-[var(--color-primary)] shadow-sm" : "text-[var(--color-text-muted)]"
            )}
          >
            {t('create_new')}
          </button>
        </div>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#5A5A40]/20">
            <Shield size={32} />
          </div>
          <h1 className="text-3xl font-bold font-display text-[var(--color-text-main)]">
            {isRegister ? t('setup_fridge') : t('login_title')}
          </h1>
          <p className="text-[var(--color-text-muted)] mt-2 text-xs font-bold uppercase tracking-widest">
            {isRegister ? t('new_fridge_desc') : "Shared Household Access"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {!isRegister && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-[10px] font-black text-[var(--color-text-muted)] mb-3 uppercase tracking-[0.2em]">{t('role')}</label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setRole(Role.Admin)}
                  className={`py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all ${
                    role === Role.Admin 
                      ? 'bg-[var(--color-primary)] text-white border-none shadow-md shadow-[#5A5A40]/20' 
                      : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {t('admin')}
                </button>
                <button
                  type="button"
                  onClick={() => setRole(Role.Member)}
                  className={`py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-widest border transition-all ${
                    role === Role.Member 
                      ? 'bg-[var(--color-primary)] text-white border-none shadow-md shadow-[#5A5A40]/20' 
                      : 'bg-[var(--color-card-bg)] text-[var(--color-text-muted)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]'
                  }`}
                >
                  {t('member')}
                </button>
              </div>
            </motion.div>
          )}

          <div className="space-y-5">
            <div className="relative">
              <User className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
              <input
                type="text"
                placeholder={isRegister ? t('username') : t('username')}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm shadow-xs"
                required
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-4 text-[var(--color-text-muted)]" size={18} />
              <input
                type="password"
                placeholder={isRegister ? t('password') : t('password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-6 py-4 rounded-2xl border border-[var(--color-border-subtle)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] transition-all bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium text-sm shadow-xs"
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
            {loading ? <Loader2 className="animate-spin" /> : null}
            <span className="uppercase tracking-[0.15em] text-xs font-black">
              {isRegister ? t('create_fridge_btn') : t('login_btn')}
            </span>
          </button>

          <p className="text-zinc-400 text-[10px] text-center leading-relaxed">
            {isRegister 
              ? "This password will be shared with your household members."
              : "Same Password = Shared Access • Different Password = Private New Fridge"
            }
          </p>
        </form>
      </motion.div>
    </div>
  );
}
