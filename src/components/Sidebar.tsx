import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  PlusCircle, 
  Bot, 
  ShoppingCart, 
  Users, 
  Settings, 
  LogOut,
  Refrigerator,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/language');
    onClose?.();
  };

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: t('dashboard') },
    { to: '/add', icon: PlusCircle, label: t('add_product') },
    { to: '/ai', icon: Bot, label: t('ai_assistant') },
    { to: '/shopping-list', icon: ShoppingCart, label: t('shopping_list') },
    { to: '/members', icon: Users, label: t('members_mgmt') },
    { to: '/settings', icon: Settings, label: t('settings') },
  ];

  return (
    <aside className="h-full w-72 lg:w-64 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] flex flex-col shadow-2xl lg:shadow-none lg:rounded-none rounded-r-[2.5rem] overflow-hidden">
      <div className="p-8 flex flex-col mb-4 relative bg-gradient-to-b from-[var(--color-background-base)]/30 to-transparent">
        <button 
          onClick={onClose}
          className="lg:hidden absolute top-5 right-5 p-2.5 bg-[var(--color-background-base)] text-[var(--color-text-muted)] hover:text-red-500 transition-all rounded-xl shadow-sm active:scale-95"
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#5A5A40]/20">
            <Refrigerator size={24} />
          </div>
          <span className="font-bold text-2xl font-display text-[var(--color-primary)] tracking-tight">{t('app_title')}</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mt-2 font-bold ml-1">SMART MANAGEMENT</p>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => onClose?.()}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mx-2",
              isActive 
                ? "bg-[var(--color-primary)] text-white shadow-md" 
                : "text-[var(--color-text-muted)] hover:bg-[var(--color-background-base)] hover:text-[var(--color-text-main)]"
            )}
          >
            <item.icon size={18} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-6 border-t border-[var(--color-border-subtle)] space-y-1 bg-[var(--color-background-base)]/50">
        <div className="px-4 py-3 mb-2">
          <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">{t('user')}</p>
          <p className="text-sm font-medium text-[var(--color-text-main)] mt-1 truncate">{user?.username}</p>
          <span className="inline-block px-2 py-0.5 bg-[var(--color-background-base)] text-[10px] font-bold text-[var(--color-text-muted)] rounded mt-1">
            {user?.role === 'Admin' ? t('admin') : t('member')}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-all font-sans"
        >
          <LogOut size={20} />
          {t('logout')}
        </button>
      </div>
    </aside>

  );
}
