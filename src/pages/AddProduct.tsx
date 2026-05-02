import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, getStorage } from 'firebase/storage';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Role } from '../types';
import { motion } from 'motion/react';
import { AlertCircle, Package, Upload, X } from 'lucide-react';

const CATEGORIES = ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Beverages', 'Snacks', 'Other'];

export default function AddProduct() {
  const { fridge, user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [formData, setFormData] = useState({
    name: '',
    category: 'Vegetables',
    expiryDate: '',
    quantity: 1
  });


  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fridge || !user) return;
    setLoading(true);

    try {
      let imageUrl = '';

      // Upload image if provided
      if (imageFile) {
        const storageInstance = getStorage();
        const storageRef = ref(storageInstance, `fridges/${fridge.id}/products/${Date.now()}-${imageFile.name}`);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const productsRef = collection(db, `fridges/${fridge.id}/products`);
      const logsRef = collection(db, `fridges/${fridge.id}/activity_logs`);
      
      const newProduct = {
        ...formData,
        quantity: parseInt(formData.quantity.toString()),
        fridgeId: fridge.id,
        addedBy: user.username,
        addedAt: new Date().toISOString(),
        isRemoved: false,
        imageUrl: imageUrl || null,
      };
      
      await addDoc(productsRef, newProduct);
      
      await addDoc(logsRef, {
        action: 'Added product',
        details: `${user.username} added ${formData.quantity}x ${formData.name}`,
        timestamp: new Date().toISOString(),
        user: user.username
      });

      setFormData({ name: '', category: 'Vegetables', expiryDate: '', quantity: 1 });
      removeImage();
      alert(t('product_added_successfully'));
    } catch (error) {
      console.error(error);
      alert(t('error_adding_product'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-3xl font-black font-display text-[var(--color-text-main)] tracking-tight flex items-center gap-3">
          <Package size={32} className="text-[var(--color-primary)]" />
          {t('add_product')}
        </h2>
        <p className="text-[var(--color-text-muted)] mt-2 font-medium">Add new items to your refrigerator inventory with images.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[var(--color-card-bg)] p-6 sm:p-10 rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xs"
      >
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Image Upload Section */}
          <div className="space-y-4">
            <label className="text-sm font-bold text-[var(--color-text-main)]">
              Product Image
            </label>
            
            {imagePreview ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative w-full"
              >
                <img 
                  src={imagePreview} 
                  alt="Product preview" 
                  className="w-full h-48 object-cover rounded-2xl border-2 border-[var(--color-border-subtle)]"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={removeImage}
                  className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-all"
                >
                  <X size={18} />
                </motion.button>
              </motion.div>
            ) : (
              <label className="relative block cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <div className="border-2 border-dashed border-[var(--color-border-subtle)] rounded-2xl p-8 text-center hover:border-[var(--color-primary)] hover:bg-[var(--color-background-base)] transition-all">
                  <Upload className="mx-auto text-[var(--color-text-muted)] mb-3" size={32} />
                  <p className="font-bold text-[var(--color-text-main)]">Click to upload product image</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">PNG, JPG, WebP up to 5MB</p>
                </div>
              </label>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Product Name */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[var(--color-text-main)]">
                {t('product_name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Milk, Tomatoes, Chicken"
                className="w-full px-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-background-base)] text-[var(--color-text-main)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[var(--color-text-main)]">
                {t('category')} <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Expiry Date */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[var(--color-text-main)]">
                {t('expiry_date')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-3">
              <label className="text-sm font-bold text-[var(--color-text-main)]">
                {t('quantity')} <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 1 })}
                className="w-full px-4 py-3 border border-[var(--color-border-subtle)] rounded-xl bg-[var(--color-background-base)] text-[var(--color-text-main)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-[var(--color-primary)] text-white rounded-xl font-black uppercase text-sm tracking-widest hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? t('adding') : t('add_product')}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
