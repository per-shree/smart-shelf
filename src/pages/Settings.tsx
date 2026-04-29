import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { 
  History, 
  Trash2, 
  HeartPulse, 
  Download, 
  User, 
  Moon, 
  Sun,
  ShieldAlert,
  Edit2,
  Check,
  X,
  Globe,
  Bell,
  Info,
  ChevronRight,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { cn, formatDate } from '../lib/utils';

interface ActivityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user: string;
}

export default function Settings() {
  const { fridge, user, updateUser, language, setLanguage } = useAuth();
  const { t } = useTranslation();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'));
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUsername, setEditUsername] = useState(user?.username || '');

  useEffect(() => {
    if (user?.username) {
      setEditUsername(user.username);
    }
  }, [user]);

  useEffect(() => {
    if (!fridge) return;
    const logsRef = collection(db, `fridges/${fridge.id}/activity_logs`);
    const q = query(logsRef, orderBy('timestamp', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setLogs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ActivityLog)).slice(0, 15));
    });
  }, [fridge]);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };

  const handleUpdateProfile = async () => {
    if (!editUsername.trim() || editUsername === user?.username) {
      setIsEditingProfile(false);
      return;
    }
    try {
      if (updateUser) {
        await updateUser(editUsername);
      }
      setIsEditingProfile(false);
    } catch (error) {
      alert("Failed to update profile");
    }
  };

  const handleExport = async () => {
    if (!fridge) return;
    const productsRef = collection(db, `fridges/${fridge.id}/products`);
    const snapshot = await getDocs(productsRef);
    const data = snapshot.docs.map(d => d.data());
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fridge_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  const healthTips = [
    { title: 'Temperature Control', tip: 'Keep the fridge at 4°C (40°F) or below.' },
    { title: 'Ethylene Gases', tip: 'Keep ethylene-producing fruits away from veggies.' },
    { title: 'First In, First Out', tip: 'Use older items first.' },
  ];

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'hi', name: 'हिन्दी' },
    { code: 'mr', name: 'मराठी' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-12 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black font-display text-[var(--color-text-main)] tracking-tight">{t('settings')}</h2>
          <p className="text-[var(--color-text-muted)] mt-2 font-medium">Control your experience and manage household data.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
          <ShieldCheck size={16} className="text-green-500" />
          <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{t('secure_session')}</span>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Content Area */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Profile Section */}
          <section className="bg-white rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-primary)] to-[#7A7A5A] rounded-[1.5rem] flex items-center justify-center text-white shadow-lg shadow-[#5A5A40]/20">
                    <User size={32} />
                  </div>
                  <div>
                    <h3 className="font-bold text-xl text-[var(--color-text-main)] font-display">{t('account_profile')}</h3>
                    <p className="text-xs text-[var(--color-text-muted)] font-medium">Manage your personal presence in this fridge.</p>
                  </div>
                </div>
                {!isEditingProfile && (
                  <button 
                    onClick={() => setIsEditingProfile(true)}
                    className="p-3 bg-[var(--color-background-base)] rounded-xl text-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white transition-all shadow-xs"
                  >
                    <Edit2 size={18} />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div className="space-y-2 p-5 bg-[var(--color-background-base)] rounded-2xl border border-[var(--color-border-subtle)]/50">
                  <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{t('username')}</p>
                  {isEditingProfile ? (
                    <div className="flex items-center gap-2">
                      <input 
                        type="text" 
                        value={editUsername} 
                        onChange={(e) => setEditUsername(e.target.value)}
                        className="text-sm font-bold text-[var(--color-text-main)] bg-white border border-[var(--color-border-subtle)] rounded-xl px-4 py-2 w-full outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
                      />
                      <button onClick={handleUpdateProfile} className="p-2 bg-green-500 text-white rounded-xl shadow-md shadow-green-500/20"><Check size={18} /></button>
                      <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-red-500 text-white rounded-xl shadow-md shadow-red-500/20"><X size={18} /></button>
                    </div>
                  ) : (
                    <p className="text-lg font-bold text-[var(--color-text-main)]">{user?.username}</p>
                  )}
                </div>
                <div className="space-y-2 p-5 bg-[var(--color-background-base)] rounded-2xl border border-[var(--color-border-subtle)]/50">
                  <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-widest">{t('role')}</p>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest",
                      user?.role === 'Admin' ? "bg-[#FFF3E0] text-[#E65100]" : "bg-white text-[var(--color-text-muted)]"
                    )}>
                      {user?.role === 'Admin' ? t('admin') : t('member')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* App Preferences */}
          <section className="bg-white rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
            <div className="p-8 space-y-8">
              <h3 className="font-bold text-xl text-[var(--color-text-main)] font-display flex items-center gap-3">
                <Globe size={22} className="text-[var(--color-primary)]" />
                {t('app_preferences')}
              </h3>
              
              <div className="space-y-6">
                {/* Language Selector */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-3xl bg-[var(--color-background-base)]/50 border border-[var(--color-border-subtle)]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-[var(--color-border-subtle)]/50">
                      <Globe size={20} className="text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{t('interface_language')}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Select your preferred language.</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => setLanguage(lang.code)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                          language === lang.code 
                            ? "bg-[var(--color-primary)] text-white shadow-md shadow-[#5A5A40]/20" 
                            : "bg-white text-[var(--color-text-muted)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)]"
                        )}
                      >
                        {lang.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Appearance */}
                <div className="flex items-center justify-between p-6 rounded-3xl bg-[var(--color-background-base)]/50 border border-[var(--color-border-subtle)]/30">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-xs border border-[var(--color-border-subtle)]/50">
                      {darkMode ? <Moon size={20} className="text-indigo-500" /> : <Sun size={20} className="text-amber-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{t('appearance_mode')}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Switch between light and dark themes.</p>
                    </div>
                  </div>
                  <button 
                    onClick={toggleDarkMode}
                    className={cn(
                      "w-16 h-8 rounded-full transition-all relative block p-1.5",
                      darkMode ? "bg-indigo-600 shadow-inner" : "bg-zinc-200"
                    )}
                  >
                    <motion.div 
                      animate={{ x: darkMode ? 32 : 0 }}
                      className="w-5 h-5 bg-white rounded-full shadow-md"
                    />
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Activity Log */}
          <section className="bg-white rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
            <div className="p-8 border-b border-[var(--color-background-base)] flex items-center justify-between">
              <h3 className="font-bold text-xl text-[var(--color-text-main)] font-display flex items-center gap-3">
                <History size={22} className="text-[var(--color-primary)]" />
                {t('recent_activity')}
              </h3>
              <span className="text-[9px] font-black uppercase tracking-widest bg-[var(--color-background-base)] px-3 py-1.5 rounded-full text-[var(--color-text-muted)]">
                Last 15 Events
              </span>
            </div>
            <div className="divide-y divide-[var(--color-background-base)] max-h-[500px] overflow-y-auto custom-scrollbar">
              {logs.map((log) => (
                <div key={log.id} className="p-6 flex items-start gap-5 hover:bg-[#FBFBFA] transition-all group">
                  <div className="mt-1 w-10 h-10 rounded-xl bg-[var(--color-background-base)] flex items-center justify-center shrink-0 border border-transparent group-hover:border-[var(--color-border-subtle)] transition-all">
                    <Info size={16} className="text-[var(--color-text-muted)]" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{log.action}</p>
                      <span className="text-[9px] text-[var(--color-text-muted)] font-bold italic opacity-60">{formatDate(log.timestamp)}</span>
                    </div>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 font-medium">{log.details}</p>
                    <div className="mt-2.5">
                      <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[var(--color-primary)] bg-[var(--color-primary)]/5 px-2 py-1 rounded-md">
                        {log.user}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              {logs.length === 0 && (
                <div className="p-20 text-center space-y-3">
                  <div className="w-16 h-16 bg-[var(--color-background-base)] rounded-full flex items-center justify-center mx-auto text-zinc-300">
                    <History size={32} />
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)] italic font-medium">No activity logs recorded yet.</p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Data Management */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs space-y-6">
            <h3 className="font-bold text-lg text-[var(--color-text-main)] font-display flex items-center gap-3">
              <Download size={18} className="text-green-500" />
              {t('data_control')}
            </h3>
            <p className="text-xs text-[var(--color-text-muted)] font-medium leading-relaxed">
              Export your refrigerator inventory as a portable JSON file for backup or analysis.
            </p>
            <button 
              onClick={handleExport}
              className="w-full btn-primary group overflow-hidden"
            >
              <div className="flex items-center justify-center gap-3 relative">
                <Download size={16} />
                <span className="uppercase text-[10px] font-black tracking-widest">{t('download_backup')}</span>
              </div>
            </button>
          </section>

          {/* Fridge Insights */}
          <section className="bg-[var(--color-primary)] p-8 rounded-[2.5rem] text-white shadow-xl shadow-[#5A5A40]/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl transition-transform group-hover:scale-150 duration-700" />
            <h3 className="font-bold mb-6 flex items-center gap-3 font-display text-lg relative">
              <div className="p-2 bg-white/20 rounded-lg"><HeartPulse size={20} /></div>
              {t('fridge_health')}
            </h3>
            <div className="space-y-6 relative">
              {healthTips.map((tip, i) => (
                <div key={i} className="group/tip">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[9px] font-black uppercase tracking-[0.15em] text-white/50">{tip.title}</p>
                    <div className="h-px bg-white/20 flex-1 group-hover/tip:bg-white/40 transition-colors" />
                  </div>
                  <p className="text-xs leading-relaxed font-medium opacity-90 italic">"{tip.tip}"</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 relative">
               <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest opacity-60">
                 <span>Efficiency</span>
                 <span>Optimal</span>
               </div>
               <div className="mt-3 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: '92%' }}
                   transition={{ duration: 1, delay: 0.5 }}
                   className="h-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                 />
               </div>
            </div>
          </section>

          {/* Sustainability */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-[var(--color-text-main)] font-display flex items-center gap-3">
                <Trash2 size={18} className="text-red-500" />
                {t('impact')}
              </h3>
              <div className="w-8 h-8 rounded-full border-2 border-red-500 flex items-center justify-center">
                <span className="text-[10px] font-black text-red-500">85</span>
              </div>
            </div>
            <div className="p-6 bg-gradient-to-br from-zinc-50 to-white rounded-3xl border border-[var(--color-border-subtle)]/50">
              <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest text-center mb-4">Sustainability Score</p>
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                    <div className="w-[85%] h-full bg-[#2E7D32]" />
                  </div>
                  <p className="text-[8px] font-bold text-[#2E7D32] uppercase tracking-tighter">Excellent Status</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-[var(--color-text-main)] font-display">A<span className="text-xs opacity-40">+</span></p>
                </div>
              </div>
            </div>
          </section>

          {/* Danger Zone */}
          <section className="p-8 rounded-[2.5rem] border border-red-100 bg-red-50/30 space-y-6">
            <div className="flex items-center gap-3">
              <AlertCircle size={18} className="text-red-600" />
              <h3 className="font-bold text-lg text-red-900 font-display">{t('danger_zone')}</h3>
            </div>
            <p className="text-xs text-red-800 font-medium leading-relaxed opacity-70">
              Irreversible actions related to your household data. Please proceed with extreme caution.
            </p>
            <button className="w-full py-4 px-6 rounded-2xl bg-white border border-red-200 text-red-600 text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2">
              <ShieldAlert size={14} />
              {t('reset_data')}
            </button>
          </section>

        </div>
      </div>
    </div>
  );
}

