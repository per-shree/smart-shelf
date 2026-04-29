import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Product, Status } from '../types';
import { Trash2, Search, Filter, ArrowUpDown } from 'lucide-react';
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
              className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-2 border border-zinc-200 rounded-xl bg-white text-sm font-medium focus:outline-none"
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

      <div className="bg-white rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
        <div className="p-6 border-b border-[var(--color-background-base)] flex justify-between items-center">
          <h3 className="font-bold text-lg font-display text-[var(--color-text-main)]">{t('current_inventory')}</h3>
          <div className="flex gap-2">
            <button className="text-[10px] uppercase font-bold tracking-widest text-[var(--color-primary)] border border-[var(--color-primary)] px-4 py-1.5 rounded-full hover:bg-[var(--color-primary)] hover:text-white transition-all">
              {t('quick_filter')}
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[var(--color-background-base)] text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
                <th className="px-8 py-4 font-bold">{t('product_name')}</th>
                <th className="px-8 py-4 font-bold">{t('category')}</th>
                <th className="px-8 py-4 font-bold">{t('quantity')}</th>
                <th className="px-8 py-4 font-bold">{t('expiry_date')}</th>
                <th className="px-8 py-4 font-bold">{t('status')}</th>
                <th className="px-8 py-4 font-bold text-right">{t('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F5F2ED] text-sm">
              <AnimatePresence>
                {filteredProducts.map((p) => {
                  const status = getStatus(p.expiryDate);
                  return (
                    <motion.tr 
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="group hover:bg-[#FBFBFA] transition-colors table-row"
                    >
                      <td className="px-8 py-5">
                        <p className="font-bold text-[var(--color-text-main)]">{p.name}</p>
                        <p className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-60">REF: {p.id.slice(0, 6).toUpperCase()}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                          {p.category}
                        </span>
                      </td>
                      <td className="px-8 py-5 font-mono font-bold text-[var(--color-text-main)]">
                        {p.quantity}
                      </td>
                      <td className="px-8 py-5 text-sm font-medium text-[var(--color-text-muted)]">
                        {formatDate(p.expiryDate)}
                      </td>
                      <td className="px-8 py-5">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                          status === 'fresh' && "bg-[#E8F5E9] text-[#2E7D32]",
                          status === 'near_expiry' && "bg-[#FFF3E0] text-[#E65100]",
                          status === 'expired' && "bg-[#FFEBEE] text-[#C62828]",
                        )}>
                          {t(status)}
                        </span>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button 
                          onClick={() => handleRemove(p.id, p.name)}
                          className="p-2 text-[var(--color-text-muted)] hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-zinc-400 italic">
                    {t('no_products')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
