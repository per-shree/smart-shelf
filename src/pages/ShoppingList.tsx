import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { ShoppingItem, Product } from '../types';
import { Plus, Trash2, CheckCircle2, Circle, Loader2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, getStatus } from '../lib/utils';

import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

export default function ShoppingList() {
  const { fridge } = useAuth();
  const { t } = useTranslation();
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (!fridge) return;
    const listPath = `fridges/${fridge.id}/shoppingList`;
    const listRef = collection(db, listPath);
    return onSnapshot(listRef, (snapshot) => {
      setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShoppingItem)));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, listPath);
    });
  }, [fridge]);

  const autoSync = async () => {
    if (!fridge) return;
    setIsSyncing(true);
    const productsPath = `fridges/${fridge.id}/products`;
    const listPath = `fridges/${fridge.id}/shoppingList`;
    try {
      const productsRef = collection(db, productsPath);
      const listRef = collection(db, listPath);
      
      let pSnapshot;
      try {
        pSnapshot = await getDocs(productsRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, productsPath);
        return;
      }

      let lSnapshot;
      try {
        lSnapshot = await getDocs(listRef);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, listPath);
        return;
      }
      
      const currentListNames = new Set(lSnapshot.docs.map(d => d.data().name.toLowerCase()));
      const products = pSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as Product));

      for (const p of products) {
        const status = getStatus(p.expiryDate);
        const alreadyExists = currentListNames.has(p.name.toLowerCase());

        if (!alreadyExists && (status === 'expired' || status === 'near_expiry' || p.isRemoved)) {
          try {
            await addDoc(listRef, {
              fridgeId: fridge.id,
              name: p.name,
              type: 'auto',
              reason: p.isRemoved ? 'Removed from fridge' : `Status: ${status}`,
              isPurchased: false,
              addedAt: new Date().toISOString()
            });
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, listPath);
          }
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !newItemName) return;
    const listPath = `fridges/${fridge.id}/shoppingList`;
    const listRef = collection(db, listPath);
    try {
      await addDoc(listRef, {
        fridgeId: fridge.id,
        name: newItemName,
        type: 'manual',
        isPurchased: false,
        addedAt: new Date().toISOString()
      });
      setNewItemName('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, listPath);
    }
  };

  const togglePurchased = async (id: string, current: boolean) => {
    if (!fridge) return;
    const itemPath = `fridges/${fridge.id}/shoppingList/${id}`;
    const itemRef = doc(db, itemPath);
    try {
      await updateDoc(itemRef, { isPurchased: !current });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, itemPath);
    }
  };

  const removeItem = async (id: string) => {
    if (!fridge) return;
    const itemPath = `fridges/${fridge.id}/shoppingList/${id}`;
    const itemRef = doc(db, itemPath);
    try {
      await deleteDoc(itemRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, itemPath);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold font-sans">{t('shopping_list')}</h2>
          <p className="text-zinc-500 mt-1">{t('smart_tracking')}</p>
        </div>
        <button 
          onClick={autoSync}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
        >
          {isSyncing ? <Loader2 className="animate-spin" size={18} /> : <RefreshCw size={18} />}
          {t('sync_fridge')}
        </button>
      </div>

      <form onSubmit={handleAddItem} className="flex gap-4">
        <input
          type="text"
          placeholder={t('add_manually')}
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 px-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20"
        />
        <button 
          type="submit"
          className="px-6 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-100"
        >
          <Plus size={20} />
        </button>
      </form>

      <div className="bg-[var(--color-card-bg)] rounded-3xl border border-[var(--color-border-subtle)] shadow-xs overflow-hidden">
        <ul className="divide-y divide-[var(--color-background-base)]">
          <AnimatePresence>
            {items.sort((a, b) => Number(a.isPurchased) - Number(b.isPurchased)).map((item) => (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={cn(
                  "p-5 flex items-center justify-between group transition-all",
                  item.isPurchased ? "bg-[var(--color-background-base)]/50" : "bg-[var(--color-card-bg)]"
                )}
              >
                <div className="flex items-center gap-5">
                  <button 
                    onClick={() => togglePurchased(item.id, item.isPurchased)}
                    className={cn(
                      "transition-all transform hover:scale-110",
                      item.isPurchased ? "text-[#2E7D32]" : "text-[var(--color-border-subtle)] hover:text-[var(--color-primary)]"
                    )}
                  >
                    {item.isPurchased ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                  </button>
                  <div>
                    <p className={cn(
                      "font-bold transition-all text-sm",
                      item.isPurchased ? "text-[var(--color-text-muted)] line-through" : "text-[var(--color-text-main)]"
                    )}>
                      {item.name}
                    </p>
                    {item.reason && (
                      <p className="text-[9px] uppercase font-black tracking-[0.15em] text-[#E65100] mt-1">
                        {item.reason}
                      </p>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => removeItem(item.id)}
                  className="p-2 text-[var(--color-border-subtle)] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {items.length === 0 && (
            <li className="p-12 text-center text-zinc-400 italic">
              {t('empty_list')}
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
