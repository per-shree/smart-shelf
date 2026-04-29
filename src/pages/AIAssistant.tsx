import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'motion/react';
import { Bot, Send, Search, Utensils, Trash2, Clock, Zap, Loader2 } from 'lucide-react';
import { getAIResponse } from '../services/aiService';
import { Product } from '../types';

export default function AIAssistant() {
  const { fridge } = useAuth();
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<Product[]>([]);
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchInventory = async () => {
      if (!fridge) return;
      const productsRef = collection(db, `fridges/${fridge.id}/products`);
      const q = query(productsRef, where('isRemoved', '==', false));
      const snapshot = await getDocs(q);
      setInventory(snapshot.docs.map(doc => doc.data() as Product));
    };
    fetchInventory();
  }, [fridge]);

  const handleAsk = async (customPrompt?: string) => {
    const queryText = customPrompt || prompt;
    if (!queryText) return;
    
    setLoading(true);
    setResponse('');
    const aiRes = await getAIResponse(queryText, inventory);
    // Clean response of common markdown symbols just in case
    const cleanRes = aiRes.replace(/[\*#_~`]/g, '');
    setResponse(cleanRes);
    setLoading(false);
    setPrompt('');
  };

  const suggestions = [
    { icon: Search, label: 'Search for a Product', prompt: 'Is there any milk in my fridge?' },
    { icon: Utensils, label: 'Suggest Recipes', prompt: 'Suggest some recipes based on what I have.' },
    { icon: Trash2, label: 'Reduce Food Wastage', prompt: 'How can I reduce food wastage with my current stock?' },
    { icon: Clock, label: 'Expiry Warnings', prompt: 'Which items are expiring soon and what should I do with them?' },
    { icon: Zap, label: 'Leftover Management', prompt: 'Give me suggestions for leftover food management.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center md:text-left">
        <h2 className="text-2xl font-bold font-sans flex items-center gap-3 justify-center md:justify-start">
          <Bot className="text-blue-600" />
          {t('ai_assistant')}
        </h2>
        <p className="text-zinc-500 mt-1">Your smart companion for kitchen management.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suggestions.map((s, i) => (
          <button
            key={i}
            onClick={() => handleAsk(s.prompt)}
            className="flex items-center gap-4 p-5 bg-[var(--color-card-bg)] rounded-2xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary)] hover:bg-[var(--color-background-base)] transition-all text-left group shadow-xs"
          >
            <div className="w-12 h-12 bg-[var(--color-background-base)] rounded-xl flex items-center justify-center text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] group-hover:bg-[var(--color-card-bg)] transition-all shadow-xs">
              <s.icon size={22} />
            </div>
            <span className="text-sm font-bold text-[var(--color-text-main)]">{s.label}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-col-reverse gap-6">
        <div className="relative">
          <textarea
            className="w-full p-6 pr-20 border border-[var(--color-border-subtle)] rounded-3xl bg-[var(--color-card-bg)] text-[var(--color-text-main)] focus:outline-none focus:ring-4 focus:ring-[var(--color-primary)]/5 focus:border-[var(--color-primary)] resize-none min-h-[120px] text-sm leading-relaxed shadow-xs"
            placeholder="Ask me anything about your fridge..."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <button 
            onClick={() => handleAsk()}
            className="absolute right-6 bottom-6 w-12 h-12 bg-[var(--color-primary)] text-white rounded-2xl flex items-center justify-center hover:opacity-90 transition-all shadow-lg shadow-[#5A5A40]/20"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Send size={24} />}
          </button>
        </div>

        {response && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="ai-panel p-8 rounded-[2.5rem] border border-[var(--color-border-subtle)] shadow-xl relative overflow-hidden bg-gradient-to-br from-[var(--color-card-bg)] to-[var(--color-background-base)]"
          >
            <div className="prose prose-sm max-w-none prose-neutral">
              <div className="flex items-center gap-3 text-[var(--color-primary)] font-black text-xs uppercase tracking-widest mb-6">
                <div className="p-2 bg-[var(--color-card-bg)] rounded-lg shadow-xs"><Bot size={18} /></div>
                <span>Arctic AI Assistant</span>
              </div>
              <div className="text-[var(--color-text-main)] leading-relaxed whitespace-pre-wrap font-medium">
                {response}
              </div>
            </div>
            {/* Speech bubble arrow */}
            <div className="absolute bottom-0 left-10 w-6 h-6 bg-[var(--color-background-base)] rotate-45 translate-y-3 border-r border-b border-[var(--color-border-subtle)]" />
          </motion.div>
        )}
      </div>

    </div>
  );
}
