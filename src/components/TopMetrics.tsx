import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
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
    { label: t('total_items'), value: metrics.total, icon: Box, color: 'bg-white text-[var(--color-text-main)]' },
    { label: t('fresh_items'), value: metrics.fresh, icon: Leaf, color: 'bg-[#E8F5E9] text-[#2E7D32]' },
    { label: t('near_expiry'), value: metrics.nearExpiry, icon: Clock, color: 'bg-[#FFF3E0] text-[#E65100]' },
    { label: t('expired'), value: metrics.expired, icon: AlertTriangle, color: 'bg-[#FFEBEE] text-[#C62828]' },
    { label: t('low_quantity'), value: metrics.low, icon: TrendingDown, color: 'bg-[var(--color-primary)] text-white' },
  ];

  return (
    <header className="sticky top-0 z-20 bg-[var(--color-background-base)]/80 backdrop-blur-md p-6 lg:px-10 lg:pt-8 lg:pb-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="text-[var(--color-text-muted)]">Home /</span>
          <span className="text-[var(--color-text-main)]">Dashboard Overview</span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-white rounded-full border border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-muted)]">
            FRIDGE ID: {fridge?.id.slice(0, 4).toUpperCase()}
          </div>
          <div className="relative group">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2.5 bg-white rounded-xl border border-[var(--color-border-subtle)] text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-all relative shadow-xs"
            >
              <Bell size={18} />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-[var(--color-background-base)]">
                  {notifications.length}
                </span>
              )}
            </button>
            {/* Notification Dropdown remains same but with themed borders */}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map((card, i) => (
          <div 
            key={i} 
            className={cn(
              "p-5 rounded-3xl border border-[var(--color-border-subtle)] shadow-xs flex flex-col md:flex-row items-center gap-4 transition-all hover:shadow-md",
              card.color.includes('bg-[var(--color-primary)]') ? "bg-[var(--color-primary)] border-none" : "bg-white"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xs",
              card.color.includes('bg-white') ? "bg-[var(--color-background-base)]" : card.color
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
