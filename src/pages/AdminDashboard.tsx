import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Product, Role } from '../types';
import { Trash2, Search, ShoppingCart, Leaf, Clock, AlertCircle, BarChart3, TrendingUp, Edit2, Plus, X, Image as ImageIcon } from 'lucide-react';
import { cn, formatDate, getStatus } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { OperationType, handleFirestoreError } from '../lib/firestoreUtils';

export default function AdminDashboard() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<any>('all');
  const [sortBy, setSortBy] = useState<'expiry' | 'qty' | 'added'>('expiry');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!fridge) return;
    const productsPath = `fridges/${fridge.id}/products`;
    const productsRef = collection(db, productsPath);
    const q = query(productsRef, where('isRemoved', '==', false));

    return onSnapshot(q, (snapshot) => {
      const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      
      // Sort based on selected option
      const sorted = [...productsList].sort((a, b) => {
        if (sortBy === 'expiry') {
          return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
        } else if (sortBy === 'qty') {
          return b.quantity - a.quantity;
        } else {
          return new Date(b.addedAt || 0).getTime() - new Date(a.addedAt || 0).getTime();
        }
      });
      
      setProducts(sorted);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, productsPath);
    });
  }, [fridge, sortBy]);

  const handleRemove = async (id: string, name: string) => {
    if (!fridge || !user) return;
    const productPath = `fridges/${fridge.id}/products/${id}`;
    const productRef = doc(db, productPath);
    const logsPath = `fridges/${fridge.id}/activity_logs`;
    const logsRef = collection(db, logsPath);

    try {
      await updateDoc(productRef, { isRemoved: true });
      await addDoc(logsRef, {
        action: 'Removed product',
        details: `${user.username} removed ${name}`,
        timestamp: new Date().toISOString(),
        user: user.username
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, productPath);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !user || !editingProduct) return;
    
    const productPath = `fridges/${fridge.id}/products/${editingProduct.id}`;
    const productRef = doc(db, productPath);
    const logsPath = `fridges/${fridge.id}/activity_logs`;
    const logsRef = collection(db, logsPath);

    try {
      await updateDoc(productRef, {
        name: editingProduct.name,
        category: editingProduct.category,
        quantity: Number(editingProduct.quantity),
        expiryDate: editingProduct.expiryDate
      });
      await addDoc(logsRef, {
        action: 'Edited product',
        details: `${user.username} edited ${editingProduct.name}`,
        timestamp: new Date().toISOString(),
        user: user.username
      });
      setEditingProduct(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, productPath);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || getStatus(p.expiryDate) === filter;
    return matchesSearch && matchesFilter;
  });

  const freshProducts = products.filter(p => getStatus(p.expiryDate) === 'fresh').length;
  const expiringSoon = products.filter(p => getStatus(p.expiryDate) === 'near_expiry').length;
  const expired = products.filter(p => getStatus(p.expiryDate) === 'expired').length;
  const totalValue = products.reduce((sum, p) => sum + p.quantity, 0);

  return (
    <div className="space-y-8">
      {/* Admin Header with Stats */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-primary)] via-orange-500 to-red-500 opacity-10 blur-3xl" />
        <div className="relative bg-gradient-to-r from-[var(--color-primary)]/90 to-orange-600/90 rounded-[2.5rem] p-8 md:p-12 text-white shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-black font-display tracking-tight">
                Admin Dashboard 🔧
              </h1>
              <p className="text-white/80 text-lg font-medium">
                Manage your fridge inventory and monitor stock levels
              </p>
              <p className="text-xs text-white/60 font-mono">
                Last updated: {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-2">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20"
              >
                <p className="text-3xl font-black">{products.length}</p>
                <p className="text-xs text-white/70 mt-1">Total Items</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-green-400/20 backdrop-blur-sm rounded-2xl p-4 border border-green-400/30"
              >
                <p className="text-3xl font-black">{freshProducts}</p>
                <p className="text-xs text-white/70 mt-1">Fresh</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-yellow-400/20 backdrop-blur-sm rounded-2xl p-4 border border-yellow-400/30"
              >
                <p className="text-3xl font-black">{expiringSoon}</p>
                <p className="text-xs text-white/70 mt-1">Expiring Soon</p>
              </motion.div>
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="bg-red-400/20 backdrop-blur-sm rounded-2xl p-4 border border-red-400/30"
              >
                <p className="text-3xl font-black">{expired}</p>
                <p className="text-xs text-white/70 mt-1">Expired</p>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Controls Bar */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex flex-col lg:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-[var(--color-text-muted)]" size={20} />
          <input 
            type="text" 
            placeholder="Search products by name or category..."
            className="w-full pl-12 pr-4 py-3 border-2 border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <select 
          className="px-6 py-3 border-2 border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium focus:outline-none focus:border-[var(--color-primary)] transition-all"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option value="fresh">🟢 Fresh</option>
          <option value="near_expiry">🟡 Expiring Soon</option>
          <option value="expired">🔴 Expired</option>
        </select>

        <select 
          className="px-6 py-3 border-2 border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] font-medium focus:outline-none focus:border-[var(--color-primary)] transition-all"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as any)}
        >
          <option value="expiry">Sort by Expiry</option>
          <option value="qty">Sort by Quantity</option>
          <option value="added">Recently Added</option>
        </select>
      </motion.div>

      {/* Inventory Table */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-[var(--color-card-bg)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden"
      >
        <div className="p-6 md:p-8 border-b border-[var(--color-background-base)]">
          <h2 className="font-black text-2xl md:text-3xl font-display text-[var(--color-text-main)] flex items-center gap-3">
            <BarChart3 size={28} className="text-[var(--color-primary)]" />
            Inventory ({filteredProducts.length} items)
          </h2>
        </div>

        {/* Unified Card Grid View */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6 md:p-8">
          <AnimatePresence mode="popLayout">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-[var(--color-background-base)] rounded-3xl border border-dashed border-[var(--color-border-subtle)]">
                <AlertCircle size={48} className="mx-auto text-[var(--color-text-muted)] mb-4 opacity-50" />
                <p className="text-[var(--color-text-muted)] text-lg font-medium">No products found</p>
              </div>
            ) : (
              filteredProducts.map((p) => {
                const status = getStatus(p.expiryDate);
                const daysUntilExpiry = Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                
                return (
                  <motion.div 
                    key={p.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-[var(--color-background-base)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs overflow-hidden flex flex-col group relative"
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
                          {status === 'fresh' && '🟢'} {status === 'near_expiry' && '🟡'} {status === 'expired' && '🔴'}
                        </span>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6 flex-1 flex flex-col gap-5">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <p className="font-black text-[var(--color-text-main)] text-xl mb-1">{p.name}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] font-mono opacity-60">
                            ID: {p.id.slice(0, 8).toUpperCase()}
                          </p>
                        </div>
                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setEditingProduct(p)}
                            className="p-3 bg-[var(--color-primary)]/10 text-[var(--color-primary)] rounded-xl hover:bg-[var(--color-primary)]/20 transition-all shadow-sm"
                            title="Edit product"
                          >
                            <Edit2 size={16} />
                          </motion.button>
                          <motion.button 
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleRemove(p.id, p.name)}
                            className="p-3 bg-red-50 dark:bg-red-900/10 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all shadow-sm"
                            title="Delete product"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <div className="bg-[var(--color-card-bg)] p-3.5 rounded-2xl border border-[var(--color-border-subtle)]/50">
                          <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Category</p>
                          <p className="text-sm font-bold text-[var(--color-text-main)]">{getCategoryEmoji(p.category)} {p.category}</p>
                        </div>
                        <div className="bg-[var(--color-card-bg)] p-3.5 rounded-2xl border border-[var(--color-border-subtle)]/50">
                          <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Quantity</p>
                          <p className="text-lg font-black text-[var(--color-text-main)] leading-none">{p.quantity}</p>
                        </div>
                      </div>

                      <div className="flex justify-between items-center bg-[var(--color-card-bg)] p-4 rounded-2xl border border-[var(--color-border-subtle)]/50">
                        <div>
                          <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Expires</p>
                          <p className="text-sm font-bold text-[var(--color-text-main)]">{formatDate(p.expiryDate)}</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5">{daysUntilExpiry > 0 ? `${daysUntilExpiry} days left` : 'Expired'}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-widest mb-1">Added By</p>
                          <p className="text-xs font-bold text-[var(--color-text-main)]">{p.addedBy || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-[var(--color-card-bg)] rounded-[2rem] p-6 max-w-md w-full shadow-2xl border border-[var(--color-border-subtle)]"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold font-display text-[var(--color-text-main)]">Edit Product</h3>
                <button onClick={() => setEditingProduct(null)} className="p-2 text-[var(--color-text-muted)] hover:bg-[var(--color-background-base)] rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <form onSubmit={handleEditSave} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Name</label>
                  <input 
                    type="text" 
                    value={editingProduct.name}
                    onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                    required 
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                  >
                    {['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Beverages', 'Snacks', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Quantity</label>
                    <input 
                      type="number" 
                      min="1"
                      value={editingProduct.quantity}
                      onChange={e => setEditingProduct({...editingProduct, quantity: Number(e.target.value)})}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      required 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)] mb-2">Expiry Date</label>
                    <input 
                      type="date" 
                      value={editingProduct.expiryDate}
                      onChange={e => setEditingProduct({...editingProduct, expiryDate: e.target.value})}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                      required 
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-background-base)] text-[var(--color-text-main)] hover:bg-[var(--color-border-subtle)] transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 py-3 rounded-xl font-bold bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity">
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helper function to get emoji for categories
function getCategoryEmoji(category: string): string {
  const emojis: { [key: string]: string } = {
    'Vegetables': '🥬',
    'Fruits': '🍎',
    'Dairy': '🥛',
    'Meat': '🥩',
    'Beverages': '🧃',
    'Snacks': '🍿',
    'Other': '📦'
  };
  return emojis[category] || '📦';
}