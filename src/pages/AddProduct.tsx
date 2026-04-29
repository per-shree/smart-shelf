import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Plus, Loader2 } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Beverages', 'Snacks', 'Other'];

export default function AddProduct() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    expiryDate: '',
    quantity: 1
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !user) return;
    setLoading(true);

    try {
      const productsRef = collection(db, `fridges/${fridge.id}/products`);
      const logsRef = collection(db, `fridges/${fridge.id}/activity_logs`);
      
      const newProduct = {
        ...formData,
        fridgeId: fridge.id,
        addedBy: user.username,
        addedAt: new Date().toISOString(),
        isRemoved: false,
      };
      
      await addDoc(productsRef, newProduct);
      
      await addDoc(logsRef, {
        action: 'Added product',
        details: `${user.username} added ${formData.quantity}x ${formData.name}`,
        timestamp: new Date().toISOString(),
        user: user.username
      });

      setFormData({ name: '', category: 'Vegetables', expiryDate: '', quantity: 1 });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-sans">{t('add_product')}</h2>
        <p className="text-zinc-500 mt-1">{t('manual_entry_desc')}</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-card-bg)] p-10 rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{t('product_name')}</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] text-sm font-medium shadow-xs"
                placeholder="e.g. Milk, Apple"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{t('category')}</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] text-sm font-medium shadow-xs"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{t(c)}</option>)}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{t('expiry_date')}</label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] text-sm font-medium shadow-xs"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[0.2em]">{t('quantity')}</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                className="w-full px-5 py-4 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] text-sm font-medium shadow-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Plus size={24} />}
            <span className="uppercase tracking-[0.15em] text-xs font-black">{t('add')}</span>
          </button>
        </form>
      </motion.div>

      <div className="bg-[var(--color-primary)]/5 border border-[var(--color-primary)]/10 p-8 rounded-3xl">
        <h3 className="text-[var(--color-primary)] font-black text-xs uppercase tracking-widest mb-3">{t('inventory_philosophy')}</h3>
        <p className="text-[var(--color-text-muted)] text-sm leading-relaxed font-medium">
          {t('inventory_philosophy_desc')}
        </p>
      </div>
    </div>
  );
}
