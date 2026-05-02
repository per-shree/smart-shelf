import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Product, Status } from '../types';
import { Trash2, Search, Filter, ArrowUpDown, Image as ImageIcon } from 'lucide-react';
import { cn, formatDate, getStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

export default function Dashboard() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<Status | 'all'>('all');

  useEffect(() => {
    if (!fridge) return;
    const productsPath = `fridges/${fridge.id}/products`;
    const productsRef = collection(db, productsPath);
    const q = query(productsRef, where('isRemoved', '==', false));

    return onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, productsPath);
    });
  }, [fridge]);

  const handleRemove = async (id: string, name: string) => {
    if (!fridge || !user) return;
    const productPath = `fridges/${fridge.id}/products/${id}`;
    const productRef = doc(db, productPath);
    const logsPath = `fridges/${fridge.id}/activity_logs`;
    const logsRef = collection(db, logsPath);

    try {
      await updateDoc(productRef, { isRemoved: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, productPath);
    }

    try {
      await addDoc(logsRef, {
        action: 'Removed product',
        details: `${user.username} removed ${name}`,
        timestamp: new Date().toISOString(),
        user: user.username
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, logsPath);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || getStatus(p.expiryDate) === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
        <h2 className="text-2xl font-bold font-sans">{t('dashboard')}</h2>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={18} />
            <input 
              type="text" 
              placeholder={t('search_products')}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] text-sm font-medium focus:outline-none"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">{t('all_status')}</option>
            <option value="fresh">{t('fresh')}</option>
            <option value="near_expiry">{t('near_expiry')}</option>
            <option value="expired">{t('expired')}</option>
          </select>
        </div>
      </div>

      <div className="bg-[var(--color-card-bg)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[var(--color-background-base)] flex justify-between items-center">
          <h3 className="font-bold text-lg font-display text-[var(--color-text-main)]">{t('current_inventory')}</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setFilter(filter === 'near_expiry' ? 'all' : 'near_expiry')}
              className={cn(
                "text-[10px] uppercase font-bold tracking-widest px-4 py-1.5 rounded-full transition-all active:scale-95",
                filter === 'near_expiry' 
                  ? "bg-[var(--color-primary)] text-white shadow-md" 
                  : "text-[var(--color-primary)] border border-[var(--color-primary)] hover:bg-[var(--color-primary)] hover:text-white"
              )}
            >
              {filter === 'near_expiry' ? 'Showing Urgent' : t('quick_filter')}
            </button>
          </div>
        </div>
        {/* Unified Card Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((p) => {
              const status = getStatus(p.expiryDate);
              return (
                <motion.div 
                  key={p.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-[var(--color-background-base)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden flex flex-col group"
                >
                  {/* Image Header */}
                  <div className="h-56 relative bg-[var(--color-card-bg)] border-b border-[var(--color-border-subtle)]">
                    {p.imageUrl ? (
                      <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center opacity-40">
                        <ImageIcon size={48} className="text-[var(--color-text-muted)] mb-3" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">No Photo</span>
                      </div>
                    )}
                    <div className="absolute top-4 right-4 flex gap-2">
                      <span className={cn(
                        "px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md",
                        status === 'fresh' && "bg-[#E8F5E9]/90 text-[#2E7D32]",
                        status === 'near_expiry' && "bg-[#FFF3E0]/90 text-[#E65100]",
                        status === 'expired' && "bg-[#FFEBEE]/90 text-[#C62828]",
                      )}>
                        {t(status)}
                      </span>
                    </div>
                  </div>

                  {/* Card Content */}
                  <div className="p-6 flex-1 flex flex-col gap-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-[var(--color-text-main)] text-xl mb-1">{p.name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-widest opacity-60">REF: {p.id.slice(0, 6).toUpperCase()}</p>
                      </div>
                      <button 
                        onClick={() => handleRemove(p.id, p.name)}
                        className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xs md:opacity-0 md:group-hover:opacity-100 max-md:opacity-100"
                        title="Remove product"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-auto">
                      <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-border-subtle)]/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">{t('category')}</p>
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{p.category}</p>
                      </div>
                      <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-border-subtle)]/50">
                        <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">{t('quantity')}</p>
                        <p className="text-sm font-bold text-[var(--color-text-main)]">{p.quantity}</p>
                      </div>
                    </div>

                    <div className="bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-border-subtle)]/50">
                      <p className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-1">{t('expiry_date')}</p>
                      <p className="text-sm font-bold text-[var(--color-text-main)]">{formatDate(p.expiryDate)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredProducts.length === 0 && (
          <div className="p-12 text-center text-[var(--color-text-muted)] italic text-sm">
            {t('no_products')}
          </div>
        )}
      </div>
    </div>
  );
}
