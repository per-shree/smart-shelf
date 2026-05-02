import React, { useEffect } from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguagePage from './pages/LanguagePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import Dashboard from './pages/Dashboard';
import AddProduct from './pages/AddProduct';
import AIAssistant from './pages/AIAssistant';
import ShoppingList from './pages/ShoppingList';
import MemberManagement from './pages/MemberManagement';
import Settings from './pages/Settings';
import ActivityLogs from './pages/ActivityLogs';
import { Role } from './types';
import { cn } from './lib/utils';
import { Home, Plus, Sparkles, ShoppingCart, Users, Settings as SettingsIcon, LogOut, BarChart3 } from 'lucide-react';

import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const { user, language } = useAuth();
  const { i18n } = useTranslation();

  useEffect(() => {
    i18n.changeLanguage(language);
    document.documentElement.setAttribute('lang', language);
  }, [language, i18n]);

  useEffect(() => {
    const isDark = localStorage.getItem('darkMode') === 'true';
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const isAdmin = user?.role === Role.Admin;

  return (
    <Routes>
      <Route path="/language" element={<LanguagePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      
      {/* MEMBER ROUTES - Base URL */}
      {!isAdmin && (
        <Route 
          path="/" 
          element={user ? <MemberLayout /> : <Navigate to="/language" />}
        >
          <Route index element={<Dashboard />} />
          <Route path="add" element={<AddProduct />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="shopping-list" element={<ShoppingList />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      )}

      {/* ADMIN ROUTES - /admin URL */}
      {isAdmin && (
        <Route 
          path="/admin" 
          element={user ? <AdminLayout /> : <Navigate to="/language" />}
        >
          <Route index element={<AdminDashboard />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="members" element={<MemberManagement />} />
          <Route path="shopping-list" element={<ShoppingList />} />
          <Route path="settings" element={<Settings />} />
          <Route path="activity" element={<ActivityLogs />} />
        </Route>
      )}

      <Route path="*" element={<Navigate to={isAdmin ? "/admin" : "/"} />} />
    </Routes>
  );
}

// MEMBER LAYOUT
function MemberLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const memberMenuItems = [
    { 
      id: 'dashboard', 
      label: t('dashboard'), 
      icon: Home, 
      path: '/',
    },
    { 
      id: 'add', 
      label: t('add_product'), 
      icon: Plus, 
      path: '/add',
    },
    { 
      id: 'ai', 
      label: t('ai_assistant'), 
      icon: Sparkles, 
      path: '/ai',
    },
    { 
      id: 'shopping-list', 
      label: t('shopping_list'), 
      icon: ShoppingCart, 
      path: '/shopping-list',
    },
    { 
      id: 'settings', 
      label: t('settings'), 
      icon: SettingsIcon as any, 
      path: '/settings',
    },
  ];

  return (
    <div className="flex h-screen bg-[var(--color-background-base)]">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex w-64 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <h1 className="font-black text-2xl font-display text-[var(--color-primary)]">Smart Shelf</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Member Portal</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {memberMenuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium",
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-[var(--color-text-main)] hover:bg-[var(--color-background-base)]"
                )}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-2">
          <button
            onClick={() => {
              logout?.();
              navigate('/language');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm">{t('logout')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-card-bg)] border-t border-[var(--color-border-subtle)] flex justify-around">
        {memberMenuItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 transition-all",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pb-0 pb-20">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

// ADMIN LAYOUT
function AdminLayout() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const adminMenuItems = [
    { 
      id: 'dashboard', 
      label: t('dashboard'), 
      icon: BarChart3, 
      path: '/admin',
    },
    { 
      id: 'ai', 
      label: t('ai_assistant'), 
      icon: Sparkles, 
      path: '/admin/ai',
    },
    { 
      id: 'shopping-list', 
      label: t('shopping_list'), 
      icon: ShoppingCart, 
      path: '/admin/shopping-list',
    },
    { 
      id: 'members', 
      label: t('members'), 
      icon: Users, 
      path: '/admin/members',
    },
    { 
      id: 'activity', 
      label: 'Activity Logs', 
      icon: BarChart3, 
      path: '/admin/activity',
    },
    { 
      id: 'settings', 
      label: t('settings'), 
      icon: SettingsIcon as any, 
      path: '/admin/settings',
    },
  ];

  return (
    <div className="flex h-screen bg-[var(--color-background-base)]">
      {/* Sidebar Navigation */}
      <nav className="hidden md:flex w-64 bg-[var(--color-card-bg)] border-r border-[var(--color-border-subtle)] flex-col">
        <div className="p-6 border-b border-[var(--color-border-subtle)]">
          <h1 className="font-black text-2xl font-display text-[var(--color-primary)]">Smart Shelf</h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">Admin Panel</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminMenuItems.map((item) => {
            const isActive = location.pathname === item.path || 
                            (item.path === '/admin' && location.pathname === '/admin');
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left font-medium",
                  isActive
                    ? "bg-[var(--color-primary)] text-white shadow-md"
                    : "text-[var(--color-text-main)] hover:bg-[var(--color-background-base)]"
                )}
              >
                <Icon size={20} />
                <span className="text-sm">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-t border-[var(--color-border-subtle)] space-y-2">
          <div className="px-4 py-3 bg-[var(--color-background-base)] rounded-xl">
            <p className="text-xs text-[var(--color-text-muted)] font-bold mb-1">LOGGED IN AS</p>
            <p className="text-sm font-black text-[var(--color-text-main)]">{user?.username}</p>
          </div>
          <button
            onClick={() => {
              logout?.();
              navigate('/language');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-left font-medium"
          >
            <LogOut size={20} />
            <span className="text-sm">{t('logout')}</span>
          </button>
        </div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-card-bg)] border-t border-[var(--color-border-subtle)] flex justify-around overflow-x-auto">
        {adminMenuItems.map((item) => {
          const isActive = location.pathname === item.path || 
                          (item.path === '/admin' && location.pathname === '/admin');
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-3 transition-all min-w-max",
                isActive
                  ? "text-[var(--color-primary)]"
                  : "text-[var(--color-text-muted)]"
              )}
            >
              <Icon size={24} />
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto md:pb-0 pb-20">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
