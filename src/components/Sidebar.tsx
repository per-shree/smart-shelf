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
  Refrigerator
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/language');
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
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-[var(--color-border-subtle)] hidden lg:flex flex-col z-30">
      <div className="p-8 flex flex-col mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[var(--color-primary)] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#5A5A40]/20">
            <Refrigerator size={24} />
          </div>
          <span className="font-bold text-2xl font-display text-[var(--color-primary)] tracking-tight">ArcticLink</span>
        </div>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--color-text-muted)] mt-2 font-bold ml-1">SMART MANAGEMENT</p>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
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
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{t('user')}</p>
          <p className="text-sm font-medium text-zinc-900 mt-1 truncate">{user?.username}</p>
          <span className="inline-block px-2 py-0.5 bg-zinc-100 text-[10px] font-bold text-zinc-500 rounded mt-1">
            {user?.role === 'Admin' ? t('admin') : t('member')}
          </span>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all font-sans"
        >
          <LogOut size={20} />
          {t('logout')}
        </button>
      </div>
    </aside>
  );
}
