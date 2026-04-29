import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

import { 
  Box, 
  Leaf, 
  Clock, 
  AlertTriangle, 
  TrendingDown,
  Menu,
  Bell,
  X
} from 'lucide-react';
import { Product } from '../types';
import { cn } from '../lib/utils';

export default function TopMetrics() {
  const { fridge } = useAuth();
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState({
    total: 0,
    fresh: 0,
    nearExpiry: 0,
    expired: 0,
    low: 0
  });
  const [notifications, setNotifications] = useState<Product[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    if (!fridge) return;

    const productsRef = collection(db, `fridges/${fridge.id}/products`);
    const q = query(productsRef, where('isRemoved', '==', false));

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(doc => doc.data() as Product);
      
      const now = new Date();
      let fresh = 0, nearItems: Product[] = [], expired = 0, low = 0;

      items.forEach(item => {
        const expiry = new Date(item.expiryDate);
        const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) expired++;
        else if (diffDays <= 3) {
          nearItems.push(item);
        } else fresh++;

        if (item.quantity <= 2) low++;
      });

      setMetrics({
        total: items.length,
        fresh,
        nearExpiry: nearItems.length,
        expired,
        low
      });
      setNotifications(nearItems);
    });
  }, [fridge]);

  const cards = [
    { label: t('total_items'), value: metrics.total, icon: Box, color: 'bg-[var(--color-card-bg)] text-[var(--color-text-main)]' },
    { label: t('fresh_items'), value: metrics.fresh, icon: Leaf, color: 'bg-[#E8F5E9] dark:bg-[#1B2E1D] text-[#2E7D32] dark:text-[#81C784]' },
    { label: t('near_expiry'), value: metrics.nearExpiry, icon: Clock, color: 'bg-[#FFF3E0] dark:bg-[#3E2723] text-[#E65100] dark:text-[#FFB74D]' },
    { label: t('expired'), value: metrics.expired, icon: AlertTriangle, color: 'bg-[#FFEBEE] dark:bg-[#3D1A1A] text-[#C62828] dark:text-[#E57373]' },
    { label: t('low_quantity'), value: metrics.low, icon: TrendingDown, color: 'bg-[var(--color-primary)] text-white' },
  ];

  const location = useLocation();
  const getPageTitle = () => {
    switch(location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/add': return 'Add New Product';
      case '/ai': return 'AI Household Assistant';
      case '/shopping-list': return 'Shopping List';
      case '/members': return 'Member Management';
      case '/settings': return 'System Settings';
      default: return 'Overview';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-background-base)]/80 backdrop-blur-md p-6 lg:px-10 lg:pt-8 lg:pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-[var(--color-text-muted)]">Home /</span>
          <span className="text-[var(--color-text-main)]">{getPageTitle()}</span>
        </div>

        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-[var(--color-card-bg)] rounded-full border border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)]">
            FRIDGE ID: {fridge?.id.slice(0, 4).toUpperCase()}
          </div>
          <div className="relative group">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-[var(--color-card-bg)] rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all relative shadow-xs"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-background-base)]">
                  {notifications.length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-[var(--color-card-bg)] rounded-[2rem] border border-[var(--color-border-subtle)] shadow-2xl z-50 overflow-hidden">
                <div className="p-5 border-b border-[var(--color-border-subtle)] bg-[var(--color-background-base)]/50 flex justify-between items-center">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-main)]">Notifications</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-[var(--color-text-muted)] hover:text-red-500 transition-all">
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map((item, idx) => (
                      <div key={idx} className="p-4 border-b border-[var(--color-border-subtle)]/50 hover:bg-[var(--color-background-base)]/30 transition-all flex items-start gap-4">
                        <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-950/20 flex items-center justify-center shrink-0">
                          <AlertTriangle size={14} className="text-red-500" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-bold text-[var(--color-text-main)]">{item.name} {t('expiring_soon')}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{t('expiry')}: {item.expiryDate}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 text-center text-[var(--color-text-muted)] italic text-xs">
                      No urgent notifications.
                    </div>
                  )}
                </div>
                <div className="p-4 text-center bg-[var(--color-background-base)]/50">
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary)] hover:opacity-80"
                  >
                    Close Panel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className={cn(
              "p-5 rounded-3xl border border-[var(--color-border-subtle)] shadow-xs flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-md",
              card.color.includes('bg-[var(--color-primary)]') ? "bg-[var(--color-primary)] border-none" : "bg-[var(--color-card-bg)]"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
              card.color.includes('bg-[var(--color-card-bg)]') ? "bg-[var(--color-background-base)]" : card.color
            )}>
              <card.icon size={22} />
            </div>
            <div className="text-center md:text-left">
              <p className={cn(
                "text-[10px] font-bold uppercase tracking-wider mb-1",
                card.color.includes('text-white') ? "text-white/70" : "text-[var(--color-text-muted)]"
              )}>{card.label}</p>
              <p className={cn(
                "text-3xl font-bold font-display",
                card.color.includes('text-white') ? "text-white" : "text-[var(--color-text-main)]"
              )}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </header>
  );
}
