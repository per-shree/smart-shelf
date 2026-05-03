import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'motion/react';
import { Bot, Send, Search, Utensils, Trash2, Clock, Zap, Loader2, X, Sparkles } from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import { Product } from '../types';

interface AIChatModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AIChatModal({ isOpen, onClose }: AIChatModalProps) {
  const { fridge, language } = useAuth();
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const responseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (loading || response) {
      responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [loading, response]);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!fridge || !isOpen) return;
      const productsRef = collection(db, `fridges/${fridge.id}/products`);
      const q = query(productsRef, where('isRemoved', '==', false));
      const snapshot = await getDocs(q);
      setInventory(snapshot.docs.map(doc => doc.data() as Product));
    };
    fetchInventory();
  }, [fridge, isOpen]);

  const handleAsk = async (customPrompt?: string) => {
    const queryText = customPrompt || prompt;
    if (!queryText) return;
    
    setLoading(true);
    setResponse('');
    const aiRes = await getAIResponse(queryText, inventory, language);
    const cleanRes = aiRes.replace(/[\*#_~`]/g, '');
    setResponse(cleanRes);
    setLoading(false);
    setPrompt('');
  };

  const suggestions = [
    { icon: Search, label: t('suggestion_search'), prompt: t('prompt_search') },
    { icon: Utensils, label: t('suggestion_recipes'), prompt: t('prompt_recipes') },
    { icon: Trash2, label: t('suggestion_waste'), prompt: t('prompt_waste') },
    { icon: Clock, label: t('suggestion_expiry'), prompt: t('prompt_expiry') },
    { icon: Zap, label: t('suggestion_leftover'), prompt: t('prompt_leftover') },
  ];

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-end md:justify-center">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-xl"
          />

          {/* Chat Container - Expands from the bottom-right button */}
          <motion.div
            initial={{ scale: 0, opacity: 0, x: '20%', y: '20%' }}
            animate={{ scale: 1, opacity: 1, x: 0, y: 0 }}
            exit={{ scale: 0, opacity: 0, x: '20%', y: '20%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{ transformOrigin: 'bottom right' }}
            className="relative w-full max-w-2xl p-4 pointer-events-none"
          >
            <div className="w-full bg-[var(--color-card-bg)] rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] pointer-events-auto overflow-hidden flex flex-col max-h-[85vh]">
              
              {/* Header */}
              <div className="p-6 border-b border-[var(--color-border-subtle)] flex items-center justify-between bg-gradient-to-r from-[var(--color-background-base)] to-[var(--color-card-bg)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center shadow-lg shadow-[#5A5A40]/20">
                    <Bot size={20} />
                  </div>
                  <div>
                    <h2 className="font-bold text-[var(--color-text-main)] font-display tracking-tight flex items-center gap-2">
                      {t('ai_assistant')}
                      <Sparkles size={14} className="text-orange-500" />
                    </h2>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-muted)]">{t('ai_companion_desc')}</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-[var(--color-background-base)] rounded-full transition-colors text-[var(--color-text-muted)]"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8 scroll-smooth custom-scrollbar">
                
                {/* Suggestions Grid (only shown if no response yet) */}
                {!response && !loading && (
                  <div className="grid grid-cols-2 sm:grid-cols-2 gap-3">
                    {suggestions.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleAsk(s.prompt)}
                        className="flex items-center gap-3 p-4 bg-[var(--color-background-base)] rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-card-bg)] transition-all text-left group shadow-xs"
                      >
                        <div className="w-8 h-8 bg-[var(--color-card-bg)] rounded-lg flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-all">
                          <s.icon size={16} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-main)]">{s.label}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* AI Response */}
                {(loading || response) && (
                  <motion.div 
                    ref={responseRef}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-6 rounded-[2rem] border border-[var(--color-border-subtle)] bg-[var(--color-background-base)] shadow-sm relative overflow-hidden"
                  >
                    <div className="flex items-center gap-2 text-[var(--color-primary)] font-black text-[10px] uppercase tracking-widest mb-4">
                      <Bot size={14} />
                      <span>{t('app_title')} AI</span>
                    </div>
                    
                    {loading ? (
                      <div className="flex flex-col items-center justify-center py-6 space-y-3">
                        <div className="relative">
                          <div className="w-8 h-8 border-3 border-[var(--color-primary)]/20 border-t-[var(--color-primary)] rounded-full animate-spin" />
                          <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--color-primary)]" size={14} />
                        </div>
                        <p className="text-[9px] font-bold text-[var(--color-text-muted)] animate-pulse tracking-widest uppercase">{t('ai_thinking')}</p>
                      </div>
                    ) : (
                      <div className="text-sm text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap font-medium">
                        {response}
                      </div>
                    )}
                  </motion.div>
                )}
              </div>

              {/* Input Area */}
              <div className="p-6 bg-[var(--color-background-base)] border-t border-[var(--color-border-subtle)]">
                <div className="relative">
                  <textarea
                    rows={2}
                    className="w-full p-4 pr-16 border border-[var(--color-border-subtle)] rounded-2xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:border-[var(--color-primary)] resize-none text-sm leading-relaxed shadow-xs placeholder:text-[var(--color-text-muted)]/50"
                    placeholder={t('ai_placeholder')}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAsk();
                      }
                    }}
                  />
                  <button 
                    onClick={() => handleAsk()}
                    disabled={loading || !prompt.trim()}
                    className="absolute right-3 bottom-3 w-10 h-10 bg-[var(--color-primary)] text-white rounded-xl flex items-center justify-center hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-[#5A5A40]/20"
                  >
                    {loading ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
}
